// Configuration for JPMorgan credential-based authentication demo

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
  get jpmorgan() { return optionalEnv('JPMORGAN_TENANT', 'jpmorgan-demo'); },
  get issuerTarget() { return `${this.organization}.${this.jpmorgan}.issuer`; },
  get verifierTarget() { return `${this.organization}.${this.jpmorgan}.verifier`; },
};

// Credential format types
export type CredentialFormat = 'jwt_vc_json' | 'mso_mdoc';

// JPMorgan credential types
export const JPMorganCredentialTypes = {
  IDENTITY: 'jpmorgan_identity_credential',
  PHOTO_ID: 'jpmorgan_photo_id',
} as const;

// Credential type configuration
export interface CredentialTypeConfig {
  id: string;
  name: string;
  format: CredentialFormat;
  credentialConfigurationId: string;
  profileId?: string;
}

// Build profile ID: {issuerTarget}.{profileSuffix}
function buildProfileId(profileSuffix: string): string {
  return `${config.issuerTarget}.${profileSuffix}`;
}

// Credential type configurations
export const credentialTypes: Record<string, CredentialTypeConfig> = {
  [JPMorganCredentialTypes.IDENTITY]: {
    id: JPMorganCredentialTypes.IDENTITY,
    name: 'JPMorgan Identity Credential',
    format: 'jwt_vc_json',
    credentialConfigurationId: JPMorganCredentialTypes.IDENTITY,
    get profileId() { return buildProfileId('identity'); },
  },
  [JPMorganCredentialTypes.PHOTO_ID]: {
    id: JPMorganCredentialTypes.PHOTO_ID,
    name: 'JPMorgan Photo ID',
    format: 'jwt_vc_json',
    credentialConfigurationId: JPMorganCredentialTypes.PHOTO_ID,
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
