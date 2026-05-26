import { config, getCredentialConfig, OpenIdCardMetadata } from '../config';
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

type MetadataCacheEntry = {
  metadata: OpenIdCardMetadata;
  expiresAt: number;
};

const VERIFIER_METADATA_CACHE_TTL_MS = 10 * 60 * 1000;
const verifierMetadataCache = new Map<string, MetadataCacheEntry>();

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
      const requestObject = await fetchJsonWithAuth(requestUri, token, 'verifier-metadata');
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

  const token = await getAuthToken();
  const urls = [
    `${config.apiUrl}/v1/${issuerTarget}/issuer-service-api/.well-known/openid-credential-issuer`,
    `${config.apiUrl}/v1/${issuerTarget}/issuer-service-api/openid-credential-issuer`,
  ];

  const raw =
    (await fetchFirstJson(urls, token, 'issuer-metadata')) ||
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

export async function getVerifierOpenIdMetadata(forceRefresh = false): Promise<OpenIdCardMetadata> {
  const cacheKey = config.verifierTarget;
  const cached = verifierMetadataCache.get(cacheKey);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.metadata;
  }

  const token = await getAuthToken();
  const requestBody = buildVerificationRequest('pid', [
    { path: ['family_name'], intent_to_retain: true },
    { path: ['given_name'], intent_to_retain: true },
    { path: ['birth_date'], intent_to_retain: true },
  ]);

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
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        console.error('VERIFIER_X5C is not valid JSON');
        return [];
      }
    })() : [],
  };

  try {
    const response = await fetch(
      `${config.apiUrl}/v1/${config.verifierTarget}/verifier2-service-api/verification-session/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      }
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

    verifierMetadataCache.set(cacheKey, {
      metadata,
      expiresAt: Date.now() + VERIFIER_METADATA_CACHE_TTL_MS,
    });

    return metadata;
  } catch {
    return {};
  }
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
  options: { signedRequest?: boolean } = {}
): Promise<{ bootstrapAuthorizationRequestUrl: string; sessionId: string }> {
  const token = await getAuthToken();

  const credentialConfig = getCredentialConfig(credentialType);
  if (!credentialConfig) {
    throw new Error(`Unknown credential type: ${credentialType}`);
  }

  // Build request body using the flexible registry
  const requestBody = buildVerificationRequest(credentialType, claims, options);

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
  }>,
  options: { signedRequest?: boolean } = {}
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

  const coreFlow: Record<string, unknown> = {
    dcql_query: {
      credentials: dcqlCredentials,
    },
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
  };

  if (options.signedRequest) {
    coreFlow.signedRequest = true;
  }

  const requestBody = {
    flow_type: 'cross_device',
    // TODO: Removed as it didn't work in the during testing
    // url_config: {
    //   url_prefix: `${config.publicUrl || config.apiUrl}/v1/${config.verifierTarget}/verifier2-service-api`,
    //   url_host: 'haip-vp://authorize',
    // },
    core_flow: coreFlow,
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
