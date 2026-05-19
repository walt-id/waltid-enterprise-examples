import { config, getCredentialConfig } from '../config';
import { 
  getCredentialRegistryEntry,
  buildRuntimeOverrides,
  buildVerificationCredentialEntry,
} from '../credentials/registry';

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

/**
 * Issue a credential via the Issuer2 Service profile-based offer API.
 * Routes to the correct department issuer based on credential type.
 */
export async function issueCredential(
  credentialType: string,
  credentialData: Record<string, unknown> | undefined,
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
      `No Issuer2 profile ID configured for credential type "${credentialType}".`
    );
  }

  const authMethod = flowType === 'auth-code' ? 'AUTHORIZED' : 'PRE_AUTHORIZED';

  const requestBody: Record<string, unknown> = {
    authMethod,
  };

  // Only include runtimeOverrides for pre-auth flow with credential data
  if (credentialData && flowType === 'pre-auth-code') {
    const runtimeOverrides = buildRuntimeOverrides(credentialType, credentialData, config.publicUrl);
    requestBody.runtimeOverrides = runtimeOverrides;
  }

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

  const data = await response.json();
  
  return {
    offerUrl: data.credentialOffer,
    offerId: data.offerId || data.issuanceSessionId || '',
    txCodeValue: data.txCodeValue,
  };
}

/**
 * Create a verification session for a single credential type.
 */
export async function createVerificationSession(
  credentialType: string,
  claims: Array<{ path: string[]; intent_to_retain?: boolean; sd?: boolean }>,
): Promise<{ bootstrapAuthorizationRequestUrl: string; sessionId: string }> {
  const token = await getAuthToken();

  const entry = getCredentialRegistryEntry(credentialType);
  if (!entry) {
    throw new Error(`Unknown credential type: ${credentialType}`);
  }

  const credentialEntry = buildVerificationCredentialEntry(credentialType, claims);

  const requestBody = {
    flow_type: 'cross_device',
    core_flow: {
      dcql_query: {
        credentials: [credentialEntry],
      },
      policies: {
        vc_policies: [{ policy: 'signature' }],
      },
    },
  };

  console.log('Verification session request:', JSON.stringify(requestBody, null, 2));

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

/**
 * Create a multi-credential verification session.
 * Requests multiple credentials in a single DCQL query with mixed formats.
 */
export async function createMultiCredentialVerificationSession(
  credentials: Array<{
    type: string;
    claims: Array<{ path: string[]; intent_to_retain?: boolean; sd?: boolean }>;
  }>
): Promise<{ bootstrapAuthorizationRequestUrl: string; sessionId: string }> {
  const token = await getAuthToken();

  // Build DCQL query with multiple credentials of different formats
  const dcqlCredentials = credentials.map(({ type, claims }) => {
    const entry = getCredentialRegistryEntry(type);
    if (!entry) {
      throw new Error(`Unknown credential type: ${type}`);
    }
    return buildVerificationCredentialEntry(type, claims);
  });

  const requestBody = {
    flow_type: 'cross_device',
    core_flow: {
      dcql_query: {
        credentials: dcqlCredentials,
      },
      policies: {
        vc_policies: [{ policy: 'signature' }],
      },
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

/**
 * Get verification session status.
 */
export async function getVerificationSessionStatus(
  sessionId: string
): Promise<{ status: string; result?: unknown }> {
  const token = await getAuthToken();

  const response = await fetch(
    `${config.apiUrl}/v1/${config.verifierTarget}.${sessionId}/verifier2-service-api/verification-session/info`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get verification status: ${error}`);
  }

  return response.json();
}
