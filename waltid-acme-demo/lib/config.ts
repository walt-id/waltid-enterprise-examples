// Configuration for Acme credential-based authentication demo

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export const config = {
  get apiUrl() { return requireEnv('WALTID_API_URL'); },
  get username() { return requireEnv('WALTID_USERNAME'); },
  get password() { return requireEnv('WALTID_PASSWORD'); },
  get publicUrl() { return requireEnv('WALTID_API_URL_PUBLIC'); },
  get organization() { return optionalEnv('WALTID_ORGANIZATION', 'waltid'); },
  get acme() { return optionalEnv('ACME_TENANT', 'acme-demo'); },
  get issuerTarget() {
    return optionalEnv('WALTID_ISSUER_TARGET', `${this.organization}.${this.acme}.issuer`);
  },
  get verifierTarget() {
    return optionalEnv('WALTID_VERIFIER_TARGET', `${this.organization}.${this.acme}.verifier`);
  },
  get untrustedVerifierTarget() {
    return optionalEnv('WALTID_UNTRUSTED_VERIFIER_TARGET', `${this.organization}.${this.acme}.untrusted-verifier`);
  },
  get walletMetadataName() { return optionalEnv('WALTID_WALLET_METADATA_NAME', 'Acme'); },
  get walletIssuerMetadataName() {
    return optionalEnv('WALTID_WALLET_ISSUER_METADATA_NAME', `${this.walletMetadataName} Issuer`);
  },
  get walletMetadataLogoUri() {
    return optionalEnv(
      'WALTID_WALLET_METADATA_LOGO_URI',
      'https://raw.githubusercontent.com/walt-id/waltid-enterprise-examples/5a3bf02f04a071d6ecc81e85e9e6492513d782b4/waltid-acme-demo/public/acme-logo.png',
    );
  },
  get walletMetadataClientUri() {
    return optionalEnv('WALTID_WALLET_METADATA_CLIENT_URI', 'https://walt.id');
  },
};

// Credential format types
export type CredentialFormat = 'jwt_vc_json' | 'mso_mdoc';

// mDoc namespace and doctype for Photo ID (ISO/IEC 23220-4)
export const MDOC_NAMESPACE = 'org.iso.23220.photoid.1';
export const MDOC_DOCTYPE = 'org.iso.23220.photoid.1';

// Acme credential types
export const AcmeCredentialTypes = {
  IDENTITY: 'acme_identity_credential',
  PHOTO_ID: 'org.iso.23220.photoid.1',  // mDoc format
} as const;


// Credential type configuration
export interface CredentialTypeConfig {
  id: string;
  name: string;
  format: CredentialFormat;
  credentialConfigurationId: string;
  doctype?: string;
  namespace?: string;
  profileId?: string;
}

// Build profile ID: {issuerTarget}.{profileSuffix}
function buildProfileId(profileSuffix: string): string {
  return `${config.issuerTarget}.${profileSuffix}`;
}

// Credential type configurations
export const credentialTypes: Record<string, CredentialTypeConfig> = {
  [AcmeCredentialTypes.IDENTITY]: {
    id: AcmeCredentialTypes.IDENTITY,
    name: 'Acme Identity Credential',
    format: 'jwt_vc_json',
    credentialConfigurationId: AcmeCredentialTypes.IDENTITY,
    get profileId() { return buildProfileId('identity'); },
  },
  [AcmeCredentialTypes.PHOTO_ID]: {
    id: AcmeCredentialTypes.PHOTO_ID,
    name: 'Acme Photo ID (mDoc)',
    format: 'mso_mdoc',
    credentialConfigurationId: AcmeCredentialTypes.PHOTO_ID,
    doctype: MDOC_DOCTYPE,
    namespace: MDOC_NAMESPACE,
    get profileId() { return buildProfileId('photo-id'); },
  },
};

// Get credential configuration by type key
export function getCredentialConfig(type: string): CredentialTypeConfig | undefined {
  return credentialTypes[type];
}

// Get all available credential types
export function getAvailableCredentialTypes(): Array<{ key: string; config: CredentialTypeConfig }> {
  return Object.entries(credentialTypes).map(([key, config]) => ({ key, config }));
}
