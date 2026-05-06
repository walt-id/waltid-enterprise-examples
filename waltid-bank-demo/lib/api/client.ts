import { config, getCredentialConfig, CredentialFormat } from '../config';
import { 
  getCredentialRegistryEntry, 
  buildRuntimeOverrides,
  buildVerificationRequest 
} from '../credentials/registry';
import '../schemas/pid'; // Register PID
import '../schemas/mdl'; // Register MDL
import '../schemas/tax'; // Register Tax
import '../schemas/payment_account'; // Register Payment Account

// Get authentication token for API calls
async function getAuthToken(): Promise<string> {
  const response = await fetch(`${config.apiUrl}/auth/account/emailpass`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: config.username,
      password: config.password,
    }),
  });

  if (!response.ok) {
    console.error(`${config.apiUrl}/auth/account/emailpass`);
    console.error(await response.text());
    throw new Error(`Authentication failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.token || data.access_token;
}

// Issue a credential via the Issuer2 Service profile-based offer API
export async function issueCredential(
  credentialType: string,
  credentialData: Record<string, unknown>,
  flowType: 'pre-auth-code' | 'auth-code',
): Promise<{ offerUrl: string; offerId: string }> {
  const token = await getAuthToken();

  const credentialConfig = getCredentialConfig(credentialType);
  if (!credentialConfig) {
    throw new Error(`Unknown credential type: ${credentialType}`);
  }

  const profileId = credentialConfig.profileId;
  if (!profileId) {
    throw new Error(
      `No Issuer2 profile ID configured for credential type "${credentialType}". ` +
      `Add a profileId to credentialTypes["${credentialType}"] in lib/config.ts.`
    );
  }

  const authMethod = flowType === 'auth-code' ? 'AUTHORIZED' : 'PRE_AUTHORIZED';
  const runtimeOverrides = buildRuntimeOverrides(credentialType, credentialData);

  // Optionally override signing key and certificate chain from env (falls back to profile defaults)
  if (process.env.ISSUER_KEY_ID) {
    runtimeOverrides.issuerKeyId = process.env.ISSUER_KEY_ID;
  }
  if (process.env.ISSUER_X5C) {
    runtimeOverrides.x5Chain = [process.env.ISSUER_X5C];
  }

  const requestBody = {
    authMethod,
    runtimeOverrides,
  };

  console.log('Issuance offer request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(
    `${config.apiUrl}/v2/${profileId}/issuer-service-api/credentials/offers`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Issuance failed: ${error}`);
  }

  const result = await response.json();
  return { offerUrl: result.credentialOffer, offerId: result.offerId };
}

// Create verification session
export async function createVerificationSession(
  credentialType: string,
  claims: Array<{ path: string[]; intent_to_retain?: boolean; sd?: boolean }>
): Promise<{ bootstrapAuthorizationRequestUrl: string; sessionId: string }> {
  const token = await getAuthToken();

  const credentialConfig = getCredentialConfig(credentialType);
  if (!credentialConfig) {
    throw new Error(`Unknown credential type: ${credentialType}`);
  }

  // Build request body using the flexible registry
  const requestBody = buildVerificationRequest(
    credentialType,
    claims,
    config.verifierTarget,
    config.publicUrl || config.apiUrl
  );

  // Add verifier credentials
  const coreFlow = requestBody.core_flow as Record<string, unknown>;
  requestBody.core_flow = {
    ...coreFlow,
    clientId: process.env.VERIFIER_CLIENT_ID,
    key: process.env.VERIFIER_KEY ? (() => {
      try {
        return JSON.parse(process.env.VERIFIER_KEY);
      } catch {
        console.error('VERIFIER_KEY is not valid JSON');
        return {};
      }
    })() : {},
    x5c: process.env.VERIFIER_X5C ? (() => {
      try {
        const parsed = JSON.parse(process.env.VERIFIER_X5C);
        if (!Array.isArray(parsed)) {
          console.error('VERIFIER_X5C must be a JSON array');
          return [];
        }
        return parsed;
      } catch {
        console.error('VERIFIER_X5C is not valid JSON');
        return [];
      }
    })() : [],
  };

  console.log('Verification request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(
    `${config.apiUrl}/v1/${config.verifierTarget}/verifier2-service-api/verification-session/create`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Verification session creation failed: ${error}`);
  }

  return response.json();
}

// Multi-credential verification session for loan approval
export async function createMultiCredentialVerificationSession(
  credentials: Array<{
    type: string;
    claims: Array<{ path: string[]; intent_to_retain?: boolean; sd?: boolean }>;
  }>
): Promise<{ bootstrapAuthorizationRequestUrl: string; sessionId: string }> {
  const token = await getAuthToken();

  // Build DCQL query with multiple credentials
  const dcqlCredentials = credentials.map(({ type, claims }) => {
    const entry = getCredentialRegistryEntry(type);
    if (!entry) {
      throw new Error(`Unknown credential type: ${type}`);
    }

    switch (entry.format) {
      case 'mso_mdoc': {
        const doctype = type === 'pid'
          ? 'eu.europa.ec.eudi.pid.1'
          : type === 'mdl'
            ? 'org.iso.18013.5.1'
            : entry.schema.fields[0]?.key || '';

        return {
          id: type,
          format: 'mso_mdoc',
          meta: {
            doctype_value: doctype,
          },
          claims: claims.map(claim => {
            // If path already starts with doctype, use as-is; otherwise prepend doctype
            const normalizedPath = claim.path[0] === doctype 
              ? claim.path 
              : [doctype, ...claim.path];
            return {
              path: normalizedPath,
              intent_to_retain: claim.intent_to_retain ?? false,
            };
          }),
        };
      }

      case 'dc+sd-jwt': {
        const credentialConfig = getCredentialConfig(type);
        const vct = credentialConfig?.vct || type;

        return {
          id: type,
          format: 'dc+sd-jwt',
          meta: {
            vct_values: [vct],
          },
          claims: claims.map(claim => ({
            path: claim.path,
          })),
        };
      }

      default:
        throw new Error(`Unsupported credential format for verification: ${entry.format}`);
    }
  });

  const requestBody = {
    flow_type: 'cross_device',
    // TODO: Removed as it didn't work in the during testing
    // url_config: {
    //   url_prefix: `${config.publicUrl || config.apiUrl}/v1/${config.verifierTarget}/verifier2-service-api`,
    //   url_host: 'haip-vp://authorize',
    // },
    core_flow: {
      dcql_query: {
        credentials: dcqlCredentials,
      },
      signed_request: true,
      // TODO: removed as it didn't work in the during testing
      // encrypted_response: true,
      clientId: process.env.VERIFIER_CLIENT_ID,
      key: process.env.VERIFIER_KEY ? (() => {
        try {
          return JSON.parse(process.env.VERIFIER_KEY);
        } catch {
          console.error('VERIFIER_KEY is not valid JSON');
          return {};
        }
      })() : {},
      x5c: process.env.VERIFIER_X5C ? (() => {
        try {
          const parsed = JSON.parse(process.env.VERIFIER_X5C);
          if (!Array.isArray(parsed)) {
            console.error('VERIFIER_X5C must be a JSON array');
            return [];
          }
          return parsed;
        } catch {
          console.error('VERIFIER_X5C is not valid JSON');
          return [];
        }
      })() : [],
    },
  };

  console.log('Multi-credential verification request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(
    `${config.apiUrl}/v1/${config.verifierTarget}/verifier2-service-api/verification-session/create`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Verification session creation failed: ${error}`);
  }

  return response.json();
}

// Get verification session status
export async function getVerificationSessionStatus(sessionId: string): Promise<{
  session: {
    status: string;
    presented_credentials?: Record<string, unknown>;
    policy_results?: Record<string, unknown>;
  };
}> {
  const token = await getAuthToken();

  const response = await fetch(
    `${config.apiUrl}/v1/${config.verifierTarget}.${sessionId}/verifier2-service-api/verification-session/info`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get session status: ${error}`);
  }

  return response.json();
}

// Export the registry functions for use in other parts of the app
export { getCredentialRegistryEntry, getCredentialConfig };
