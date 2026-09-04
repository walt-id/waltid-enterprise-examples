function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value.trim();
}

function optionalEnv(name: string, defaultValue: string): string {
  return (process.env[name] || defaultValue).trim();
}

export const config = {
  get apiUrl() { return requireEnv('WALTID_API_URL'); },
  get username() { return requireEnv('WALTID_USERNAME'); },
  get password() { return requireEnv('WALTID_PASSWORD'); },
  get publicUrl() { return requireEnv('WALTID_API_URL_PUBLIC'); },
  get organization() { return optionalEnv('WALTID_ORGANIZATION', 'waltid'); },
  get govIssuerTenant() { return optionalEnv('GOV_ISSUER_TENANT', 'gov'); },
  get govIssuerName() { return optionalEnv('GOV_ISSUER_NAME', 'eid-issuer'); },
  get taxTenant() { return optionalEnv('TAX_TENANT', 'tax'); },
  get taxIssuerName() { return optionalEnv('TAX_ISSUER_NAME', 'tax-issuer'); },
  get taxVerifierTarget() { return requireEnv('TAX_VERIFIER_TARGET'); },
};

export type CredentialFormat = 'jwt_vc_json';

export interface CredentialTypeConfig {
  id: string;
  name: string;
  format: CredentialFormat;
  profileId: string;
  credentialConfigurationId: string;
}

function buildProfileId(tenant: string, issuerName: string, profileSuffix: string): string {
  return `${config.organization}.${tenant}.${issuerName}.${profileSuffix}`;
}

export const credentialTypes: Record<string, CredentialTypeConfig> = {
  national_mobile_id: {
    id: 'NationalMobileIdentityCredential',
    name: 'National Mobile Identity Credential',
    format: 'jwt_vc_json',
    get profileId() { return buildProfileId(config.govIssuerTenant, config.govIssuerName, 'national-id'); },
    credentialConfigurationId: 'NationalMobileIdentityCredential',
  },
  tax_registration_cert: {
    id: 'TaxRegistrationCertificate',
    name: 'Tax Registration Certificate',
    format: 'jwt_vc_json',
    get profileId() { return buildProfileId(config.taxTenant, config.taxIssuerName, 'tax-cert'); },
    credentialConfigurationId: 'TaxRegistrationCertificate',
  },
};

export function getCredentialConfig(type: string): CredentialTypeConfig | undefined {
  return credentialTypes[type];
}
