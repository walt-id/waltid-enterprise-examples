import { CredentialFormat, getCredentialConfig, JPMorganCredentialTypes } from '../config';

// Schema imports
import { jpmorganIdentityFields, jpmorganIdentityDefaultValues, jpmorgaranIdentityClaims } from '../schemas/jpmorgan-identity';
import { jpmorganPhotoIdFields, jpmorganPhotoIdDefaultValues, jpmorganPhotoIdClaims } from '../schemas/jpmorgan-photo-id';

// W3C VC DM 2.0 context URLs
const W3C_VC_CONTEXT = [
  'https://www.w3.org/2018/credentials/v1',
  'https://purl.imsglobal.org/spec/ob/v3p0/context.json'
];

// W3C VC configuration for jwt_vc_json credentials
export interface W3cVcConfig {
  credentialType: string;
  issuerName: string;
  issuerUrl: string;
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
  w3cVcConfig?: W3cVcConfig;
  claims: Array<{
    path: string[];
    label: string;
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

// Register JPMorgan Identity credential (W3C VC format)
registerCredential(JPMorganCredentialTypes.IDENTITY, {
  format: 'jwt_vc_json',
  schema: {
    fields: [...jpmorganIdentityFields] as Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'email' | 'tel'; required: boolean }>,
    defaultValues: { ...jpmorganIdentityDefaultValues } as Record<string, unknown>,
  },
  w3cVcConfig: {
    credentialType: 'JPMorganIdentityCredential',
    issuerName: 'JPMorgan Identity Verification',
    issuerUrl: '',
  },
  claims: jpmorgaranIdentityClaims,
});

// Register JPMorgan Photo ID credential (W3C VC format)
registerCredential(JPMorganCredentialTypes.PHOTO_ID, {
  format: 'jwt_vc_json',
  schema: {
    fields: [...jpmorganPhotoIdFields] as Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'email' | 'tel'; required: boolean }>,
    defaultValues: { ...jpmorganPhotoIdDefaultValues } as Record<string, unknown>,
  },
  w3cVcConfig: {
    credentialType: 'JPMorganPhotoIDCredential',
    issuerName: 'JPMorgan Photo ID Verification',
    issuerUrl: '',
  },
  claims: jpmorganPhotoIdClaims,
});

/**
 * Build W3C VC DM 2.0 credential data structure for jwt_vc_json format.
 */
function buildW3cVcCredentialData(
  credentialType: string,
  issuerName: string,
  issuerUrl: string,
  subjectData: Record<string, unknown>
): Record<string, unknown> {
  return {
    '@context': W3C_VC_CONTEXT,
    id: 'urn:uuid:placeholder',
    type: ['VerifiableCredential', credentialType],
    name: credentialType.replace(/Credential$/, '').replace(/([A-Z])/g, ' $1').trim(),
    issuanceDate: new Date().toISOString(),
    issuer: {
      type: ['Profile'],
      name: issuerName,
      url: issuerUrl,
      id: 'did:placeholder:issuer',
    },
    credentialSubject: {
      id: 'did:placeholder:subject',
      type: ['Person'],
      ...subjectData,
    },
  };
}

/**
 * Build the runtimeOverrides payload for an Issuer2 credential offer.
 */
export function buildRuntimeOverrides(
  type: string,
  credentialData: Record<string, unknown>,
  issuerUrl?: string,
): Record<string, unknown> {
  const entry = getCredentialRegistryEntry(type);
  if (!entry) {
    throw new Error(`Credential type ${type} not registered`);
  }

  const overrides: Record<string, unknown> = {};

  switch (entry.format) {
    case 'jwt_vc_json': {
      // Build full W3C VC structure for jwt_vc_json
      if (!entry.w3cVcConfig) {
        throw new Error(`Missing W3C VC config for credential type: ${type}`);
      }

      const { credentialType, issuerName } = entry.w3cVcConfig;
      const url = issuerUrl || entry.w3cVcConfig.issuerUrl || '';

      overrides.credentialData = buildW3cVcCredentialData(
        credentialType,
        issuerName,
        url,
        credentialData
      );
      break;
    }


    default:
      throw new Error(`Unsupported credential format: ${entry.format}`);
  }

  return overrides;
}

/**
 * Build verification request body based on credential format.
 * Constructs format-specific DCQL query entries.
 */
export function buildVerificationCredentialEntry(
  type: string,
  claims: Array<{ path: string[]; intent_to_retain?: boolean; sd?: boolean }>,
): Record<string, unknown> {
  const entry = getCredentialRegistryEntry(type);
  if (!entry) {
    throw new Error(`Credential type ${type} not registered`);
  }

  const credentialConfig = getCredentialConfig(type);

  switch (entry.format) {
    case 'jwt_vc_json': {
      return {
        id: type,
        format: 'jwt_vc_json',
        meta: {
          type_values: [
            [
              'VerifiableCredential',
              'JPMorganIdentityCredential'
            ]
          ]
        },
      };
    }


    default:
      throw new Error(`Unsupported credential format for verification: ${entry.format}`);
  }
}
