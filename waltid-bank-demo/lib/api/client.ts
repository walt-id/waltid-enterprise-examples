import { config, getCredentialConfig } from '../config';
import { 
  getCredentialRegistryEntry,
  registerCredential,
  buildRuntimeOverrides,
  buildVerificationRequest 
} from '../credentials/registry';
import { pidDefaultValues, pidFields, pidIdTokenMapping, pidDataMapping, pidClaims } from '../schemas/pid';
import { mdlDefaultValues, mdlFields, mdlIdTokenMapping, mdlDataMapping, mdlClaims } from '../schemas/mdl';
import { taxCredentialDefaultValues, taxCredentialFields, taxCredentialIdTokenMapping, taxCredentialSDJWTConfig, taxCredentialClaims } from '../schemas/tax';
import { paymentAccountDefaultValues, paymentAccountFields, paymentAccountSDJWTConfig, paymentAccountClaims } from '../schemas/payment_account';
import { getSimplePidVerificationRequestBody } from '../simplePidVerificationRequests';

// Register all credential types
registerCredential('pid', {
  format: 'mso_mdoc',
  schema: {
    fields: [...pidFields] as Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'email' | 'tel'; required: boolean }>,
    defaultValues: { ...pidDefaultValues } as Record<string, unknown>,
  },
  mappings: {
    idTokenMapping: pidIdTokenMapping,
    dataMapping: pidDataMapping,
  },
  claims: pidClaims,
});

registerCredential('tax', {
  format: 'dc+sd-jwt',
  schema: {
    fields: [...taxCredentialFields] as Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'email' | 'tel'; required: boolean }>,
    defaultValues: { ...taxCredentialDefaultValues } as Record<string, unknown>,
  },
  mappings: {
    idTokenMapping: taxCredentialIdTokenMapping,
  },
  sdjwtConfig: taxCredentialSDJWTConfig,
  claims: taxCredentialClaims,
});

registerCredential('mdl', {
  format: 'mso_mdoc',
  schema: {
    fields: [...mdlFields] as Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'email' | 'tel'; required: boolean }>,
    defaultValues: { ...mdlDefaultValues } as Record<string, unknown>,
  },
  mappings: {
    idTokenMapping: mdlIdTokenMapping,
    dataMapping: mdlDataMapping,
  },
  claims: mdlClaims,
});

registerCredential('payment_account', {
  format: 'dc+sd-jwt',
  schema: {
    fields: [...paymentAccountFields] as Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'email' | 'tel'; required: boolean }>,
    defaultValues: { ...paymentAccountDefaultValues } as Record<string, unknown>,
  },
  mappings: {},
  sdjwtConfig: paymentAccountSDJWTConfig,
  claims: paymentAccountClaims,
});

export interface VerificationTransactionData {
  type: string;
  fields: Record<string, string>;
  credentialIds?: string[];
}

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
  useTxCode?: boolean,
): Promise<{ offerUrl: string; offerId: string; txCodeValue?: string }> {
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

  const requestBody: Record<string, unknown> = {
    authMethod,
    runtimeOverrides,
  };

  // Add txCode for pre-auth flow if requested
  if (useTxCode && flowType === 'pre-auth-code') {
    requestBody.txCode = {
      input_mode: 'numeric',
      length: 6,
      description: 'Enter the PIN code displayed on screen',
    };
  }

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
  return { 
    offerUrl: result.credentialOffer, 
    offerId: result.offerId,
    txCodeValue: result.txCodeValue,
  };
}

// Create verification session
export async function createVerificationSession(
  credentialType: string,
  claims: Array<{ path: string[]; intent_to_retain?: boolean; sd?: boolean }>,
  transactionData?: VerificationTransactionData,
  requestOverrideId?: string,
): Promise<{ bootstrapAuthorizationRequestUrl: string; sessionId: string }> {
  const token = await getAuthToken();

  const credentialConfig = getCredentialConfig(credentialType);
  if (!credentialConfig) {
    throw new Error(`Unknown credential type: ${credentialType}`);
  }

  const usesRequestOverride = credentialType === 'pid' && Boolean(requestOverrideId);
  const requestBody =
    usesRequestOverride
      ? getSimplePidVerificationRequestBody(requestOverrideId)
      : buildVerificationRequest(
          credentialType,
          claims,
          config.verifierTarget,
          config.publicUrl || config.apiUrl
        );

  if (!requestBody) {
    throw new Error(`Unknown PID verification request override: ${requestOverrideId}`);
  }

  if (!usesRequestOverride) {
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
  }

  if (transactionData) {
    const updatedCoreFlow = requestBody.core_flow as Record<string, unknown>;
    const dcqlQuery = updatedCoreFlow.dcql_query as Record<string, unknown> | undefined;
    const dcqlCredentials = Array.isArray(dcqlQuery?.credentials)
      ? (dcqlQuery.credentials as Array<Record<string, unknown>>)
      : [];
    const credentialIds = transactionData.credentialIds?.length
      ? transactionData.credentialIds
      : dcqlCredentials
        .map(credential => credential.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);

    if (credentialIds.length === 0) {
      throw new Error('Transaction data requires at least one DCQL credential id');
    }

    dcqlCredentials
      .filter(credential => credentialIds.includes(String(credential.id)))
      .forEach(credential => {
        credential.require_cryptographic_holder_binding = true;
      });

    requestBody.openid = {
      ...((requestBody.openid as Record<string, unknown> | undefined) ?? {}),
      transactionData: [
        {
          type: transactionData.type,
          credential_ids: credentialIds,
          transaction_data_hashes_alg: ['sha-256'],
          require_cryptographic_holder_binding: true,
          ...transactionData.fields,
        },
      ],
    };
  }

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
        const credentialConfig = getCredentialConfig(type);
        const doctype =
          credentialConfig?.doctype ||
          credentialConfig?.credentialConfigurationId ||
          type;

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
