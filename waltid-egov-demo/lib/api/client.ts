// Allow self-signed / ngrok certificates in sandbox environments
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '1') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { config, getCredentialConfig } from '../config';
import { getCredentialRegistryEntry, buildRuntimeOverrides, buildVerificationCredentialEntry } from '../credentials/registry';

type VerificationPolicy = {
  policy: string;
  [key: string]: unknown;
};

type VerificationSessionOptions = {
  verifierTarget?: string;
  vcPolicies?: VerificationPolicy[];
};

async function getAuthToken(): Promise<string> {
  const response = await fetch(`${config.apiUrl}/auth/account/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: config.username,
      password: config.password,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Authentication failed (${response.status} ${response.statusText}) — ` +
      `URL: ${config.apiUrl}/auth/account/emailpass` +
      (body ? ` — ${body}` : '')
    );
  }

  const data = await response.json();
  return data.token || data.access_token;
}

function buildVerificationRequestBody(
  dcqlCredentials: Record<string, unknown>[],
  options: VerificationSessionOptions = {},
): Record<string, unknown> {
  return {
    flow_type: 'cross_device',
    core_flow: {
      dcql_query: {
        credentials: dcqlCredentials,
      },
      policies: {
        vc_policies: options.vcPolicies || [{ policy: 'signature' }],
      },
    },
  };
}

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
    throw new Error(`No profile ID configured for credential type "${credentialType}"`);
  }

  const authMethod = flowType === 'auth-code' ? 'AUTHORIZED' : 'PRE_AUTHORIZED';
  const requestBody: Record<string, unknown> = { authMethod };

  if (credentialData && flowType === 'pre-auth-code') {
    const runtimeOverrides = buildRuntimeOverrides(credentialType, credentialData, config.publicUrl);
    requestBody.runtimeOverrides = runtimeOverrides;
  }

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

export async function createVerificationSession(
  credentialType: string,
  claims: Array<{ path: string[]; intent_to_retain?: boolean; sd?: boolean }>,
  options: VerificationSessionOptions = {},
): Promise<{ bootstrapAuthorizationRequestUrl: string; sessionId: string }> {
  const token = await getAuthToken();

  const entry = getCredentialRegistryEntry(credentialType);
  if (!entry) throw new Error(`Unknown credential type: ${credentialType}`);

  const credentialEntry = buildVerificationCredentialEntry(credentialType, claims);
  const requestBody = buildVerificationRequestBody([credentialEntry], options);

  console.log('Verification session request:', JSON.stringify(requestBody, null, 2));

  const verifierTarget = options.verifierTarget || config.taxVerifierTarget;

  const response = await fetch(
    `${config.apiUrl}/v2/${verifierTarget}/verifier-service-api/verification-session/create`,
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

export async function getVerificationSessionStatus(
  sessionId: string,
  verifierTarget: string,
): Promise<{ status: string; result?: unknown }> {
  const token = await getAuthToken();

  const response = await fetch(
    `${config.apiUrl}/v2/${verifierTarget}.${sessionId}/verifier-service-api/verification-session/info`,
    {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get verification status: ${error}`);
  }

  return response.json();
}
