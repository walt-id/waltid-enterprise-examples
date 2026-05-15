import { CredentialFormat, getCredentialConfig } from '../config';

// Base interface for credential mappings
export interface CredentialMapping {
  idTokenMapping?: Record<string, string>;
  dataMapping?: Record<string, unknown>;
}

// SD-JWT specific configuration
export interface SDJWTConfig {
  mapping?: {
    id?: string;
    iat?: string;
    nbf?: string;
    exp?: string;
  };
  selectiveDisclosure?: {
    fields: Record<string, { sd: boolean }>;
  };
}

// Credential registry entry
export interface CredentialRegistryEntry {
  format: CredentialFormat;
  schema: {
    fields: Array<{
      key: string;
      label: string;
      type: 'text' | 'number' | 'date' | 'email' | 'tel';
      required: boolean;
    }>;
    defaultValues: Record<string, unknown>;
  };
  mappings?: CredentialMapping;
  sdjwtConfig?: SDJWTConfig;
  // For verification
  claims?: Array<{
    path: string[];
    label: string;
    sd?: boolean; // For SD-JWT selective disclosure
  }>;
}

// Credential registry
const credentialRegistry: Record<string, CredentialRegistryEntry> = {};

// Register a credential type
export function registerCredential(
  type: string,
  config: CredentialRegistryEntry
): void {
  credentialRegistry[type] = config;
}

// Get credential configuration
export function getCredentialRegistryEntry(type: string): CredentialRegistryEntry | undefined {
  return credentialRegistry[type];
}

// Check if credential type is registered
export function isCredentialRegistered(type: string): boolean {
  return type in credentialRegistry;
}

// Get all registered credential types
export function getRegisteredCredentialTypes(): string[] {
  return Object.keys(credentialRegistry);
}

/**
 * Build the runtimeOverrides payload for an Issuer2 credential offer.
 * Profile-level config (key, x5Chain, mapping, selectiveDisclosure) is already
 * stored in the backend profile; we only need to supply per-request credentialData.
 */
export function buildRuntimeOverrides(
  type: string,
  credentialData: Record<string, unknown>,
): Record<string, unknown> {
  const entry = getCredentialRegistryEntry(type);
  if (!entry) {
    throw new Error(`Credential type ${type} not registered`);
  }

  const credentialConfig = getCredentialConfig(type);
  const overrides: Record<string, unknown> = {};

  switch (entry.format) {
    case 'mso_mdoc': {
      const dataKey =
        credentialConfig?.mdocNamespace ||
        credentialConfig?.doctype ||
        credentialConfig?.credentialConfigurationId ||
        type;
      overrides.credentialData = { [dataKey]: credentialData };
      break;
    }

    case 'dc+sd-jwt':
    case 'jwt_vc': {
      overrides.credentialData = credentialData;
      break;
    }

    default:
      throw new Error(`Unsupported credential format: ${entry.format}`);
  }

  return overrides;
}

// Build verification request body based on credential format
export function buildVerificationRequest(
  type: string,
  claims: Array<{ path: string[]; intent_to_retain?: boolean; sd?: boolean }>,
  verifierTarget: string,
  publicUrl: string
): Record<string, unknown> {
  const entry = getCredentialRegistryEntry(type);
  if (!entry) {
    throw new Error(`Credential type ${type} not registered`);
  }

  const baseRequest = {
    flow_type: 'cross_device',
    // TODO: re-enable if HAIP cross-device flow is required
    // url_config: {
    //   url_prefix: `${publicUrl}/v1/${verifierTarget}/verifier2-service-api`,
    //   url_host: 'haip-vp://authorize',
    // },
    core_flow: {} as Record<string, unknown>,
  };

  switch (entry.format) {
    case 'mso_mdoc': {
      const credentialConfig = getCredentialConfig(type);
      const doctype =
        credentialConfig?.doctype ||
        credentialConfig?.credentialConfigurationId ||
        type;
      
      baseRequest.core_flow = {
        dcql_query: {
          credentials: [
            {
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
            },
          ],
        },
        signed_request: true,
        // TODO: removed as it didn't work in the during testing
        // encrypted_response: true,
      };
      break;
    }
    
    case 'dc+sd-jwt': {
      const credentialConfig = getCredentialConfig(type);
      const vct = credentialConfig?.vct || type;

      baseRequest.core_flow = {
        dcql_query: {
          credentials: [
            {
              id: type,
              format: 'dc+sd-jwt',
              meta: {
                vct_values: [vct],
              },
              claims: claims.map(claim => ({
                path: claim.path,
              })),
            },
          ],
        },
        signed_request: true,
        // TODO: removed as it didn't work in the during testing
        // encrypted_response: true,
      };
      break;
    }
    
    default:
      throw new Error(`Unsupported credential format for verification: ${entry.format}`);
  }

  return baseRequest;
}
