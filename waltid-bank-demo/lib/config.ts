// Configuration for walt.id Enterprise Stack
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  get apiUrl() { return requireEnv('WALTID_API_URL'); },
  get username() { return requireEnv('WALTID_USERNAME'); },
  get password() { return requireEnv('WALTID_PASSWORD'); },
  get issuerTarget() { return requireEnv('WALTID_ISSUER_TARGET'); },
  get verifierTarget() { return requireEnv('WALTID_VERIFIER_TARGET'); },
  get publicUrl() { return requireEnv('WALTID_API_URL_PUBLIC'); },
};

/** Build full Issuer2 profile resource id: {org}.{tenant}.{issuer}.{profileSuffix} */
function buildProfileId(profileSuffix: string): string {
  return `${config.issuerTarget}.${profileSuffix}`;
}

/** Build VCT URL: {publicUrl}/{credentialConfigurationId} (matches bank-tenant issuer config) */
function buildVct(credentialConfigurationId: string): string {
  const base = config.publicUrl.replace(/\/$/, '');
  return `${base}/${credentialConfigurationId}`;
}

export const MDL_DOC_TYPE = 'org.iso.18013.5.1.mDL';
export const MDL_NAMESPACE = 'org.iso.18013.5.1';

// Credential format types
export type CredentialFormat = 'mso_mdoc' | 'dc+sd-jwt' | 'jwt_vc';
export type IconKey = 'landmark' | 'shield-check';

export interface OpenIdCardMetadata {
  name?: string;
  description?: string;
  logoUri?: string;
  logoAltText?: string;
  /** Whether the metadata was returned as a signed JWT */
  isSignedMetadata?: boolean;
  /** X.509 certificate chain from the signed metadata JWT header */
  x5cCertificateChain?: string[];
}

export interface IssuerCardConfig {
  id: 'bank';
  issuerTarget: string;
  credentialKeys: string[];
  fallbackName: string;
  fallbackDescription: string;
  fallbackIcon: IconKey;
}

export interface VerifierCardConfig {
  id: 'bank';
  verifierTarget: string;
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackIcon: IconKey;
}

// Base credential type configuration
export interface CredentialTypeConfig {
  id: string;
  name: string;
  format: CredentialFormat;
  doctype?: string; // For mso_mdoc (credential configuration / DCQL doctype_value)
  /** Namespace key for mso_mdoc credentialData when different from doctype */
  mdocNamespace?: string;
  vct?: string; // For SD-JWT
  issuerKeyId?: string;
  credentialConfigurationId: string;
  /** Issuer2 Service profile resource identifier ({org}.{tenant}.{issuer}.{profileId}) */
  profileId?: string;
}

// Credential type configurations (using getters for lazy evaluation to avoid
// accessing env vars at module load time before Next.js loads .env)
export const credentialTypes: Record<string, CredentialTypeConfig> = {
  pid: {
    id: 'eu.europa.ec.eudi.pid.1',
    name: 'Person Identification Data (PID)',
    format: 'mso_mdoc',
    doctype: 'eu.europa.ec.eudi.pid.1',
    credentialConfigurationId: 'eu.europa.ec.eudi.pid.1',
    get profileId() { return buildProfileId('pid'); },
  },
  mdl: {
    id: MDL_DOC_TYPE,
    name: 'Mobile Driving Licence (MDL)',
    format: 'mso_mdoc',
    doctype: MDL_DOC_TYPE,
    mdocNamespace: MDL_NAMESPACE,
    credentialConfigurationId: MDL_DOC_TYPE,
    get profileId() { return buildProfileId('mdl'); },
  },
  tax: {
    id: 'tax_credential',
    name: 'German Tax Credential',
    format: 'dc+sd-jwt',
    get vct() { return buildVct('tax_credential'); },
    credentialConfigurationId: 'tax_credential',
    get profileId() { return buildProfileId('tax'); },
  },
  payment_account: {
    id: 'payment_account',
    name: 'Payment Account (SCA)',
    format: 'dc+sd-jwt',
    get vct() { return buildVct('payment_account'); },
    credentialConfigurationId: 'payment_account',
    get profileId() { return buildProfileId('sca'); },
  },
};

export const issuerCard: IssuerCardConfig = {
  id: 'bank',
  get issuerTarget() { return config.issuerTarget; },
  credentialKeys: ['pid', 'mdl', 'tax', 'payment_account'],
  fallbackName: 'Demo Bank Issuer',
  fallbackDescription: 'Issues wallet credentials used by the banking demo.',
  fallbackIcon: 'landmark',
};

export const verifierCard: VerifierCardConfig = {
  id: 'bank',
  get verifierTarget() { return config.verifierTarget; },
  fallbackTitle: 'Demo Bank Verifier',
  fallbackDescription: 'Verifies wallet credentials for account opening and loan applications.',
  fallbackIcon: 'shield-check',
};


// Flow types
export const flowTypes = {
  preAuthCode: {
    id: 'pre-auth-code',
    name: 'Pre-Authorization Code',
    description: 'Wallet scans QR code to receive credential',
  },
  authCode: {
    id: 'auth-code',
    name: 'Authorization Code',
    description: 'User authenticates before receiving credential',
  },
};

// Get credential configuration by type
export function getCredentialConfig(type: string): CredentialTypeConfig | undefined {
  return credentialTypes[type];
}

// Get all available credential types
export function getAvailableCredentialTypes(): Array<{ id: string; name: string; format: CredentialFormat }> {
  return Object.entries(credentialTypes).map(([key, config]) => ({
    id: key,
    name: config.name,
    format: config.format,
  }));
}
