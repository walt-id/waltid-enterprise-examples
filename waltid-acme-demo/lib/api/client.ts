import { config, getCredentialConfig } from '../config';
import {
  getCredentialRegistryEntry,
  buildRuntimeOverrides,
  buildVerificationCredentialEntry,
} from '../credentials/registry';

type VerificationPolicy = {
  policy: string;
  [key: string]: unknown;
};

type VerificationSessionOptions = {
  verifierTarget?: string;
  vcPolicies?: VerificationPolicy[];
};

type VerificationSessionState = {
  status?: string;
  attempted?: boolean;
  presented_credentials?: Record<string, unknown>;
  [key: string]: unknown;
};

type VerificationSessionStatusResponse = {
  status?: string;
  session?: VerificationSessionState;
  [key: string]: unknown;
};

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

async function ensureIssuerDisplayMetadata(token: string): Promise<void> {
  const displayUrl = `${config.apiUrl}/v2/${config.issuerTarget}/issuer-service-api/configuration/openid-metadata/display`;
  const currentResponse = await fetch(`${displayUrl}/view`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!currentResponse.ok) {
    throw new Error(`Reading issuer display metadata failed: ${currentResponse.statusText}`);
  }

  const current = await currentResponse.json() as Array<{
    name?: string;
    logo?: { uri?: string };
  }>;
  const desired = {
    name: config.walletIssuerMetadataName,
    logo: { uri: config.walletMetadataLogoUri },
  };

  if (current.some((entry) =>
    entry.name === desired.name && entry.logo?.uri === desired.logo.uri
  )) {
    return;
  }

  const updateResponse = await fetch(`${displayUrl}/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify([desired]),
  });

  if (!updateResponse.ok) {
    throw new Error(`Updating issuer display metadata failed: ${updateResponse.statusText}`);
  }
}

function buildVerificationRequestBody(
    dcqlCredentials: Record<string, unknown>[],
): Record<string, unknown> {
  return {
    flow_type: 'cross_device',
    core_flow: {
      dcql_query: {
        credentials: dcqlCredentials,
      },
      client_metadata: {
        client_name: config.walletMetadataName,
        logo_uri: config.walletMetadataLogoUri,
        client_uri: config.walletMetadataClientUri,
      },
    },
  };
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
  await ensureIssuerDisplayMetadata(token);

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

  console.log('Walt.id credential offer response:', data);

  return {
    offerUrl: data.credentialOffer || data.credential_offer,
    offerId: data.offerId || data.issuanceSessionId || data.offer_id || '',
    txCodeValue: data.txCodeValue || data.tx_code_value,
  };
}

/**
 * Create a verification session for a single credential type.
 */
export async function createVerificationSession(
  credentialType: string,
  claims: Array<{ path: string[]; intent_to_retain?: boolean; sd?: boolean }>,
  options: VerificationSessionOptions = {},
): Promise<{ bootstrapAuthorizationRequestUrl: string; sessionId: string }> {
  const token = await getAuthToken();

  console.log('Building verification entry for credential type:', credentialType);
  const entry = getCredentialRegistryEntry(credentialType);
  if (!entry) {
    throw new Error(`Unknown credential type: ${credentialType}`);
  }

  const credentialEntry = buildVerificationCredentialEntry(credentialType, claims);
  console.log('Credential entry built:', JSON.stringify(credentialEntry, null, 2));

  const requestBody = buildVerificationRequestBody([credentialEntry]);
  

  console.log('Verification session request:', JSON.stringify(requestBody, null, 2));

  const verifierUrl = `${config.apiUrl}/v2/${options.verifierTarget || config.verifierTarget}/verifier-service-api/verification-session/create`;
  console.log('Calling verifier endpoint:', verifierUrl);

  const response = await fetch(verifierUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });

  console.log('Verification response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.error('Verification session failed:', error);
    throw new Error(`Verification session creation failed: ${error}`);
  }

  const data = await response.json();
  console.log('Verification session response:', data);

  return {
    bootstrapAuthorizationRequestUrl: data.bootstrapAuthorizationRequestUrl || data.bootstrap_authorization_request_url || '',
    sessionId: data.sessionId || data.session_id || data.id || '',
  };
}

/**
 * Create a multi-credential verification session.
 * Requests multiple credentials in a single DCQL query with mixed formats.
 */
export async function createMultiCredentialVerificationSession(
  credentials: Array<{
    type: string;
    claims: Array<{ path: string[]; intent_to_retain?: boolean; sd?: boolean }>;
  }>,
  options: VerificationSessionOptions = {},
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

  const requestBody = buildVerificationRequestBody(dcqlCredentials);

  console.log('Multi-credential verification request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(
    `${config.apiUrl}/v2/${options.verifierTarget || config.verifierTarget}/verifier-service-api/verification-session/create`,
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
  sessionId: string,
  verifierTarget = config.verifierTarget,
): Promise<VerificationSessionStatusResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${config.apiUrl}/v2/${verifierTarget}.${sessionId}/verifier-service-api/verification-session/info`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Verification status response error:', response.status, error);
    throw new Error(`Failed to get verification status (${response.status}): ${error || 'Empty response'}`);
  }

  const result = await response.json();
  console.log('Verification status result:', result);
  return result;
}
