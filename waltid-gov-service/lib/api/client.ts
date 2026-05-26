import {
  config,
  getCredentialConfig,
  OpenIdCardMetadata,
  VerifierKind,
  verificationPoliciesFor,
  verifierTargetFor,
} from '../config';
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
  signedRequest?: boolean;
};

type MetadataCacheEntry = {
  metadata: OpenIdCardMetadata;
  expiresAt: number;
};

const VERIFIER_METADATA_CACHE_TTL_MS = 10 * 60 * 1000;
const verifierMetadataCache = new Map<VerifierKind, MetadataCacheEntry>();

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

function buildVerificationRequestBody(
  dcqlCredentials: Record<string, unknown>[],
  options: VerificationSessionOptions = {},
): Record<string, unknown> {
  const coreFlow: Record<string, unknown> = {
    dcql_query: {
      credentials: dcqlCredentials,
    },
    policies: {
      vc_policies: options.vcPolicies || [{ policy: 'signature' }],
    },
  };

  if (options.signedRequest) {
    coreFlow.signed_request = true;
  }

  return {
    flow_type: 'cross_device',
    core_flow: coreFlow,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return undefined;
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function parseJwtPayload(jwt: string): unknown {
  const [, payload] = jwt.split('.');
  if (!payload) return undefined;
  return parseJson(decodeBase64Url(payload));
}

function pickLocalizedDisplay(displays: unknown): Record<string, unknown> | undefined {
  if (!Array.isArray(displays)) return undefined;

  const records = displays.filter(isRecord);
  return (
    records.find(display => String(display.locale || '').toLowerCase().startsWith('en')) ||
    records[0]
  );
}

function metadataFromDisplay(display: Record<string, unknown> | undefined): OpenIdCardMetadata {
  if (!display) return {};

  const logo = isRecord(display.logo) ? display.logo : undefined;

  return {
    name: firstString(display.name),
    description: firstString(display.description),
    logoUri: firstString(logo?.uri, display.logo_uri),
    logoAltText: firstString(logo?.alt_text, display.name),
  };
}

function normalizeIssuerMetadata(raw: unknown, credentialConfigurationId?: string): OpenIdCardMetadata {
  if (!isRecord(raw)) return {};

  const topLevel = metadataFromDisplay(
    pickLocalizedDisplay(raw.display || raw.issuerDisplayConfiguration)
  );

  const configurations = raw.credential_configurations_supported || raw.credentialConfigurations;
  const credentialConfig = isRecord(configurations)
    ? configurations[credentialConfigurationId || ''] || Object.values(configurations).find(isRecord)
    : undefined;
  const credentialMetadata = isRecord(credentialConfig) && isRecord(credentialConfig.credential_metadata)
    ? credentialConfig.credential_metadata
    : undefined;
  const credentialDisplay = metadataFromDisplay(
    isRecord(credentialConfig) ? pickLocalizedDisplay(credentialConfig.display || credentialMetadata?.display) : undefined
  );

  return {
    name: topLevel.name || credentialDisplay.name,
    description: topLevel.description || credentialDisplay.description,
    logoUri: topLevel.logoUri || credentialDisplay.logoUri,
    logoAltText: topLevel.logoAltText || credentialDisplay.logoAltText,
  };
}

function normalizeVerifierMetadata(raw: unknown): OpenIdCardMetadata {
  if (!isRecord(raw)) return {};

  const clientMetadata =
    (isRecord(raw.client_metadata) && raw.client_metadata) ||
    (isRecord(raw.clientMetadata) && raw.clientMetadata) ||
    raw;

  return {
    name: firstString(clientMetadata.client_name, raw.client_name),
    description: firstString(clientMetadata.description, raw.description),
    logoUri: firstString(clientMetadata.logo_uri, raw.logo_uri),
    logoAltText: firstString(clientMetadata.client_name, raw.client_name),
  };
}

async function fetchJsonWithAuth(
  url: string,
  token?: string,
  context = 'metadata',
): Promise<unknown | undefined> {
  try {
    console.log(`[${context}] GET ${url} ${token ? '(with auth)' : '(without auth)'}`);

    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: 'no-store',
    });

    console.log(`[${context}] ${response.status} ${response.statusText} for ${url}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      if (errorText) {
        console.log(`[${context}] error body: ${errorText.slice(0, 500)}`);
      }
      return undefined;
    }

    const text = await response.text();
    const parsed = parseJson(text);

    if (parsed && isRecord(parsed)) {
      console.log(`[${context}] response keys: ${Object.keys(parsed).join(', ')}`);
    } else {
      console.log(`[${context}] non-JSON response length: ${text.length}`);
    }

    return parsed || text;
  } catch (error) {
    console.log(`[${context}] request failed for ${url}:`, error);
    return undefined;
  }
}

async function fetchFirstJson(
  urls: string[],
  token?: string,
  context?: string,
): Promise<unknown | undefined> {
  for (const url of urls) {
    const json = await fetchJsonWithAuth(url, token, context);
    if (json) return json;
  }
  return undefined;
}

async function extractAuthorizationRequestMetadata(
  authorizationRequestUrl: string | undefined,
  token: string,
): Promise<OpenIdCardMetadata> {
  if (!authorizationRequestUrl) return {};

  try {
    const url = new URL(authorizationRequestUrl);
    const clientMetadata = url.searchParams.get('client_metadata');
    if (clientMetadata) {
      const parsed = parseJson(decodeURIComponent(clientMetadata));
      const normalized = normalizeVerifierMetadata({ client_metadata: parsed });
      if (normalized.name || normalized.logoUri) return normalized;
    }

    const requestJwt = url.searchParams.get('request');
    if (requestJwt) {
      const normalized = normalizeVerifierMetadata(parseJwtPayload(requestJwt));
      if (normalized.name || normalized.logoUri) return normalized;
    }

    const requestUri = url.searchParams.get('request_uri');
    if (requestUri) {
      const requestObject = await fetchJsonWithAuth(requestUri, token);
      const normalizedFromJson = normalizeVerifierMetadata(requestObject);
      if (normalizedFromJson.name || normalizedFromJson.logoUri) return normalizedFromJson;

      if (typeof requestObject === 'string') {
        return normalizeVerifierMetadata(parseJwtPayload(requestObject));
      }
    }
  } catch {
    return {};
  }

  return {};
}

export async function getIssuerOpenIdMetadata(
  issuerTarget: string,
  credentialConfigurationId?: string,
): Promise<OpenIdCardMetadata> {
  console.log(
    `[issuer-metadata] start issuerTarget=${issuerTarget} credentialConfigurationId=${credentialConfigurationId || '(none)'}`
  );

  const urls = [
    `${config.apiUrl}/.well-known/openid-credential-issuer/v2/${issuerTarget}/issuer-service-api/openid4vci`,
  ];

  const raw =
    (await fetchFirstJson(urls, undefined, 'issuer-metadata'));

  if (!raw) {
    console.log(`[issuer-metadata] no metadata response for ${issuerTarget}`);
    return {};
  }

  const normalized = normalizeIssuerMetadata(raw, credentialConfigurationId);
  console.log(`[issuer-metadata] normalized ${issuerTarget}:`, {
    hasName: Boolean(normalized.name),
    name: normalized.name,
    hasLogo: Boolean(normalized.logoUri),
    logoUri: normalized.logoUri,
    hasDescription: Boolean(normalized.description),
  });

  return normalized;
}

export async function getVerifierOpenIdMetadata(
  verifierKind: VerifierKind,
  forceRefresh = false,
): Promise<OpenIdCardMetadata> {
  const cached = verifierMetadataCache.get(verifierKind);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.metadata;
  }

  const token = await getAuthToken();
  const verifierTarget = verifierTargetFor(verifierKind);
  const requestBody = buildVerificationRequestBody(
    [
      {
        id: 'photo_id',
        format: 'mso_mdoc',
        meta: {
          doctype_value: getCredentialConfig('photo_id')?.doctype,
        },
        claims: [
          { path: ['org.iso.23220.1', 'family_name'] },
          { path: ['org.iso.23220.1', 'given_name'] },
          { path: ['org.iso.23220.1', 'birth_date'] },
        ],
      },
    ],
    {
      verifierTarget,
      vcPolicies: verificationPoliciesFor(verifierKind),
    },
  );

  try {
    const response = await fetch(
      `${config.apiUrl}/v1/${verifierTarget}/verifier2-service-api/verification-session/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) return {};

    const data = await response.json();
    const direct = normalizeVerifierMetadata(data);
    const fromRequest = await extractAuthorizationRequestMetadata(
      data.bootstrapAuthorizationRequestUrl,
      token,
    );
    const metadata = {
      name: direct.name || fromRequest.name,
      description: direct.description || fromRequest.description,
      logoUri: direct.logoUri || fromRequest.logoUri,
      logoAltText: direct.logoAltText || fromRequest.logoAltText,
    };

    verifierMetadataCache.set(verifierKind, {
      metadata,
      expiresAt: Date.now() + VERIFIER_METADATA_CACHE_TTL_MS,
    });

    return metadata;
  } catch {
    return {};
  }
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
  options: VerificationSessionOptions = {},
): Promise<{ bootstrapAuthorizationRequestUrl: string; sessionId: string }> {
  const token = await getAuthToken();

  const entry = getCredentialRegistryEntry(credentialType);
  if (!entry) {
    throw new Error(`Unknown credential type: ${credentialType}`);
  }

  const credentialEntry = buildVerificationCredentialEntry(credentialType, claims);

  const requestBody = buildVerificationRequestBody([credentialEntry], options);

  console.log('Verification session request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(
    `${config.apiUrl}/v1/${options.verifierTarget || config.verifierTarget}/verifier2-service-api/verification-session/create`,
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

  const requestBody = buildVerificationRequestBody(dcqlCredentials, options);

  console.log('Multi-credential verification request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(
    `${config.apiUrl}/v1/${options.verifierTarget || config.verifierTarget}/verifier2-service-api/verification-session/create`,
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
): Promise<{ status: string; result?: unknown }> {
  const token = await getAuthToken();

  const response = await fetch(
    `${config.apiUrl}/v1/${verifierTarget}.${sessionId}/verifier2-service-api/verification-session/info`,
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
