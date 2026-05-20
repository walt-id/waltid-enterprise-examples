import { CredentialFormat, getCredentialConfig, PHOTO_ID_NAMESPACE } from '../config';

// Schema imports
import { employeeStatusDefaultValues, employeeStatusFields, employeeStatusClaims } from '../schemas/employee-status';
import { photoIdDefaultValues, photoIdFields, photoIdClaims, photoIdDataMapping } from '../schemas/photo-id';
import { addressProofDefaultValues, addressProofFields, addressProofClaims } from '../schemas/address-proof';
import { taxRegistrationDefaultValues, taxRegistrationFields, taxRegistrationClaims, taxRegistrationSDJWTConfig } from '../schemas/tax-registration';
import { bankAccountDefaultValues, bankAccountFields, bankAccountClaims } from '../schemas/bank-account';

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
  mappings?: {
    dataMapping?: Record<string, unknown>;
  };
  sdjwtConfig?: SDJWTConfig;
  w3cVcConfig?: W3cVcConfig;
  claims: Array<{
    path: string[];
    label: string;
    sd?: boolean;
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

// Register all credential types
registerCredential('employee_status', {
  format: 'jwt_vc_json',
  schema: {
    fields: [...employeeStatusFields] as Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'email' | 'tel'; required: boolean }>,
    defaultValues: { ...employeeStatusDefaultValues } as Record<string, unknown>,
  },
  w3cVcConfig: {
    credentialType: 'EmployeeStatusCredential',
    issuerName: 'Human Resources Department',
    issuerUrl: '', // Will be set from env at runtime
  },
  claims: employeeStatusClaims,
});

registerCredential('photo_id', {
  format: 'mso_mdoc',
  schema: {
    fields: [...photoIdFields] as Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'email' | 'tel'; required: boolean }>,
    defaultValues: { ...photoIdDefaultValues } as Record<string, unknown>,
  },
  mappings: {
    dataMapping: photoIdDataMapping,
  },
  claims: photoIdClaims,
});

registerCredential('untrusted_photo_id', {
  format: 'mso_mdoc',
  schema: {
    fields: [...photoIdFields] as Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'email' | 'tel'; required: boolean }>,
    defaultValues: { ...photoIdDefaultValues } as Record<string, unknown>,
  },
  mappings: {
    dataMapping: photoIdDataMapping,
  },
  claims: photoIdClaims,
});

registerCredential('address_proof', {
  format: 'jwt_vc_json',
  schema: {
    fields: [...addressProofFields] as Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'email' | 'tel'; required: boolean }>,
    defaultValues: { ...addressProofDefaultValues } as Record<string, unknown>,
  },
  w3cVcConfig: {
    credentialType: 'AddressProofCredential',
    issuerName: 'Identity Services Department',
    issuerUrl: '',
  },
  claims: addressProofClaims,
});

registerCredential('tax_registration', {
  format: 'dc+sd-jwt',
  schema: {
    fields: [...taxRegistrationFields] as Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'email' | 'tel'; required: boolean }>,
    defaultValues: { ...taxRegistrationDefaultValues } as Record<string, unknown>,
  },
  sdjwtConfig: taxRegistrationSDJWTConfig,
  claims: taxRegistrationClaims,
});

registerCredential('bank_account', {
  format: 'jwt_vc_json',
  schema: {
    fields: [...bankAccountFields] as Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'email' | 'tel'; required: boolean }>,
    defaultValues: { ...bankAccountDefaultValues } as Record<string, unknown>,
  },
  w3cVcConfig: {
    credentialType: 'BankAccountCredential',
    issuerName: 'Financial Services Authority',
    issuerUrl: '',
  },
  claims: bankAccountClaims,
});

/**
 * Build W3C VC DM 2.0 credential data structure for jwt_vc_json format.
 * This includes all required fields: @context, type, issuer, credentialSubject, etc.
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
 * Different formats require different credential data structures.
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

  const credentialConfig = getCredentialConfig(type);
  const overrides: Record<string, unknown> = {};

  switch (entry.format) {
    case 'mso_mdoc': {
      // Wrap data in namespace for mso_mdoc
      const namespace = credentialConfig?.mdocNamespace || PHOTO_ID_NAMESPACE;
      overrides.credentialData = { [namespace]: credentialData };
      break;
    }

    case 'dc+sd-jwt': {
      // Flat structure for SD-JWT
      overrides.credentialData = credentialData;
      break;
    }

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
    case 'mso_mdoc': {
      const doctype = credentialConfig?.doctype || credentialConfig?.credentialConfigurationId || type;
      const namespace = credentialConfig?.mdocNamespace || PHOTO_ID_NAMESPACE;
      
      return {
        id: type,
        format: 'mso_mdoc',
        meta: {
          doctype_value: doctype,
        },
        claims: claims.map(claim => {
          // Ensure claims have the namespace prefix
          const normalizedPath = claim.path[0] === namespace 
            ? claim.path 
            : [namespace, ...claim.path];
          return {
            path: normalizedPath,
            intent_to_retain: claim.intent_to_retain ?? false,
          };
        }),
      };
    }
    
    case 'dc+sd-jwt': {
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

    case 'jwt_vc_json': {
      return {
        id: type,
        format: 'jwt_vc_json',
        meta: {},
        claims: claims.map(claim => ({
          path: claim.path.filter(path => path !== "vc"),
        })),
      };
    }
    
    default:
      throw new Error(`Unsupported credential format for verification: ${entry.format}`);
  }
}
