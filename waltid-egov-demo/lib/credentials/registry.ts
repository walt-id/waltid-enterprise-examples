import { getCredentialConfig } from '../config';
import { nationalMobileIdDefaultValues, nationalMobileIdFields, nationalMobileIdClaims } from '../schemas/national-mobile-id';
import { taxRegistrationCertDefaultValues, taxRegistrationCertFields, taxRegistrationCertClaims } from '../schemas/tax-registration-cert';

const W3C_VC_CONTEXT = ['https://www.w3.org/2018/credentials/v1'];

export interface W3cVcConfig {
  credentialType: string;
  issuerName: string;
  issuerUrl: string;
}

export interface CredentialRegistryEntry {
  format: 'jwt_vc_json';
  schema: {
    fields: Array<{
      key: string;
      label: string;
      type: 'text' | 'number' | 'date' | 'email' | 'tel';
      required: boolean;
    }>;
    defaultValues: Record<string, unknown>;
  };
  w3cVcConfig: W3cVcConfig;
  claims: Array<{ path: string[]; label: string; sd?: boolean }>;
}

const credentialRegistry: Record<string, CredentialRegistryEntry> = {};

export function registerCredential(type: string, config: CredentialRegistryEntry): void {
  credentialRegistry[type] = config;
}

export function getCredentialRegistryEntry(type: string): CredentialRegistryEntry | undefined {
  return credentialRegistry[type];
}

registerCredential('national_mobile_id', {
  format: 'jwt_vc_json',
  schema: {
    fields: [...nationalMobileIdFields] as Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'email' | 'tel'; required: boolean }>,
    defaultValues: { ...nationalMobileIdDefaultValues } as Record<string, unknown>,
  },
  w3cVcConfig: {
    credentialType: 'NationalMobileIdentityCredential',
    issuerName: 'Government Identity Authority (GIA) / e-ID Department',
    issuerUrl: '',
  },
  claims: nationalMobileIdClaims,
});

registerCredential('tax_registration_cert', {
  format: 'jwt_vc_json',
  schema: {
    fields: [...taxRegistrationCertFields] as Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'email' | 'tel'; required: boolean }>,
    defaultValues: { ...taxRegistrationCertDefaultValues } as Record<string, unknown>,
  },
  w3cVcConfig: {
    credentialType: 'TaxRegistrationCertificate',
    issuerName: 'Revenue Authority (RA) / Tax Department',
    issuerUrl: '',
  },
  claims: taxRegistrationCertClaims,
});

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
    issuanceDate: new Date().toISOString(),
    issuer: {
      type: ['Profile'],
      name: issuerName,
      url: issuerUrl,
      id: 'did:placeholder:issuer',
    },
    credentialSubject: {
      id: 'did:placeholder:subject',
      ...subjectData,
    },
  };
}

export function buildRuntimeOverrides(
  type: string,
  credentialData: Record<string, unknown>,
  issuerUrl?: string,
): Record<string, unknown> {
  const entry = getCredentialRegistryEntry(type);
  if (!entry) throw new Error(`Credential type ${type} not registered`);

  const { credentialType, issuerName } = entry.w3cVcConfig;
  const url = issuerUrl || entry.w3cVcConfig.issuerUrl || '';

  return {
    credentialData: buildW3cVcCredentialData(credentialType, issuerName, url, credentialData),
  };
}

export function buildVerificationCredentialEntry(
  type: string,
  claims: Array<{ path: string[]; intent_to_retain?: boolean; sd?: boolean }>,
): Record<string, unknown> {
  const entry = getCredentialRegistryEntry(type);
  if (!entry) throw new Error(`Credential type ${type} not registered`);

  const credentialConfig = getCredentialConfig(type);
  const configId = credentialConfig?.id || type;

  return {
    id: type,
    format: 'jwt_vc_json',
    meta: {
      type_values: [[configId]],
    },
    claims: claims.map(claim => ({
      path: claim.path.filter(p => p !== 'vc'),
    })),
  };
}
