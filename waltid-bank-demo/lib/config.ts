// Configuration for walt.id Enterprise Stack
export const config = {
  apiUrl: process.env.WALTID_API_URL || 'https://waltid.eudi-demo.enterprise.test.waltid.cloud',
  username: process.env.WALTID_USERNAME || 'superadmin@walt.id',
  password: process.env.WALTID_PASSWORD || 'super123456',
  issuerTarget: process.env.WALTID_ISSUER_TARGET || 'waltid.tenant1.issuer4',
  verifierTarget: process.env.WALTID_VERIFIER_TARGET || 'waltid.tenant1.verifier1',
  publicUrl: process.env.WALTID_API_URL_PUBLIC || process.env.WALTID_API_URL,
};

// Credential format types
export type CredentialFormat = 'mso_mdoc' | 'dc+sd-jwt' | 'jwt_vc';

// Base credential type configuration
export interface CredentialTypeConfig {
  id: string;
  name: string;
  format: CredentialFormat;
  doctype?: string; // For mso_mdoc
  vct?: string; // For SD-JWT
  issuerKeyId?: string;
  credentialConfigurationId: string;
  /** Issuer2 Service profile resource identifier ({org}.{tenant}.{issuer}.{profileId}) */
  profileId?: string;
}

// Credential type configurations
export const credentialTypes: Record<string, CredentialTypeConfig> = {
  pid: {
    id: 'eu.europa.ec.eudi.pid.1',
    name: 'Person Identification Data (PID)',
    format: 'mso_mdoc',
    doctype: 'eu.europa.ec.eudi.pid.1',
    credentialConfigurationId: 'eu.europa.ec.eudi.pid.1',
    profileId: 'waltid.tenant1.issuer4.pid-1',
  },
  mdl: {
    id: 'org.iso.18013.5.1.mDL',
    name: 'Mobile Driving Licence (MDL)',
    format: 'mso_mdoc',
    doctype: 'org.iso.18013.5.1',
    credentialConfigurationId: 'org.iso.18013.5.1.mDL',
    // TODO: create MDL profile in Issuer2 Service and set profileId
  },
  tax: {
    id: 'tax_credential',
    name: 'German Tax Credential',
    format: 'dc+sd-jwt',
    vct: 'https://waltid.eudi-demo.enterprise.test.waltid.cloud/.well-known/vct/v1/waltid.tenant1.issuer4/issuer-service-api2/openid4vc/v1/tax_credential',
    credentialConfigurationId: 'tax_credential',
    // TODO: create tax credential profile in Issuer2 Service and set profileId
  },
  payment_account: {
    id: 'payment_account',
    name: 'Payment Account (SCA)',
    format: 'dc+sd-jwt',
    vct: 'https://waltid.eudi-demo.enterprise.test.waltid.cloud/.well-known/vct/v2/waltid.tenant1.issuer4/issuer-service-api/openid4vci/payment_account',
    credentialConfigurationId: 'payment_account',
    profileId: 'waltid.tenant1.issuer4.sd-jwt-1',
  },
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
