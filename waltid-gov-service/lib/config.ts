// Configuration for walt.id Enterprise Stack - Government Services Demo

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
  get centralTenant() { return optionalEnv('GOV_CENTRAL_TENANT', 'gov-central'); },
  get verifierTarget() { return requireEnv('GOV_VERIFIER_TARGET'); },
  get untrustedVerifierTarget() {
    return `${this.organization}.${this.departments.untrusted}.untrusted-verifier`;
  },
  get verifierKeyReference() {
    return `${this.organization}.${this.centralTenant}.kms.gov-verifier-signing-key`;
  },
  get untrustedVerifierKeyReference() {
    return `${this.organization}.${this.centralTenant}.kms.untrusted-signing-key`;
  },
  get vctBaseUrl() { return optionalEnv('GOV_VCT_BASE_URL', this.publicUrl); },
  departments: {
    get hr() { return optionalEnv('GOV_DEPT_HR', 'dept-hr'); },
    get identity() { return optionalEnv('GOV_DEPT_IDENTITY', 'dept-identity'); },
    get revenue() { return optionalEnv('GOV_DEPT_REVENUE', 'dept-revenue'); },
    get finance() { return optionalEnv('GOV_DEPT_FINANCE', 'dept-finance'); },
    get untrusted() { return optionalEnv('GOV_UNTRUSTED_TENANT', 'untrusted-dept'); },
  },
};

// ISO 23220 Photo ID constants
export const PHOTO_ID_DOCTYPE = 'org.iso.23220.photoid.1';
export const PHOTO_ID_NAMESPACE = 'org.iso.23220.1';

// Credential format types
export type CredentialFormat = 'jwt_vc_json' | 'mso_mdoc' | 'dc+sd-jwt';

// Department identifiers
export type DepartmentId = 'hr' | 'identity' | 'revenue' | 'finance' | 'untrusted';
export type VerifierKind = 'trusted' | 'untrusted';
export type IconKey = 'users' | 'file-text' | 'receipt' | 'credit-card' | 'building' | 'shield-check';

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

// Department configuration
export interface DepartmentInfo {
  id: DepartmentId;
  name: string;
  description: string;
  tenantId: string;
  issuerName: string;
}

export interface IssuerCardConfig {
  id: DepartmentId;
  credentialKeys: string[];
  issuerTarget: string;
  fallbackName: string;
  fallbackDescription: string;
  fallbackIcon: IconKey;
  badges: Array<{
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
  }>;
}

export interface VerifierCardConfig {
  id: VerifierKind;
  verifierTarget: string;
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackIcon: IconKey;
  badge: string;
  badgeClassName: string;
}

// Static department info (no env vars needed at build time)
export const departments: Record<DepartmentId, DepartmentInfo> = {
  hr: {
    id: 'hr',
    name: 'HR Department',
    description: 'Human Resources - Employee credentials',
    get tenantId() { return config.departments.hr; },
    issuerName: 'hr-issuer',
  },
  identity: {
    id: 'identity',
    name: 'Identity Services',
    description: 'Government identity documents',
    get tenantId() { return config.departments.identity; },
    issuerName: 'identity-issuer',
  },
  revenue: {
    id: 'revenue',
    name: 'Revenue Authority',
    description: 'Tax registration and compliance',
    get tenantId() { return config.departments.revenue; },
    issuerName: 'revenue-issuer',
  },
  finance: {
    id: 'finance',
    name: 'Financial Services',
    description: 'Bank account verification',
    get tenantId() { return config.departments.finance; },
    issuerName: 'finance-issuer',
  },
  untrusted: {
    id: 'untrusted',
    name: 'Untrusted Department',
    description: 'Negative trust-list demo issuer',
    get tenantId() { return config.departments.untrusted; },
    issuerName: 'untrusted-issuer',
  },
};

// Credential type configuration
export interface CredentialTypeConfig {
  id: string;
  name: string;
  format: CredentialFormat;
  department: DepartmentId;
  profileId: string;
  doctype?: string;
  mdocNamespace?: string;
  vct?: string;
  credentialConfigurationId: string;
}

// Build issuer target path: {org}.{dept-tenant}.{issuer}
function buildIssuerTarget(deptTenant: string, issuerName: string): string {
  return `${config.organization}.${deptTenant}.${issuerName}`;
}

// Build profile ID: {issuerTarget}.{profileSuffix}
function buildProfileId(deptTenant: string, issuerName: string, profileSuffix: string): string {
  return `${buildIssuerTarget(deptTenant, issuerName)}.${profileSuffix}`;
}

// Build VCT URL for SD-JWT credentials
function buildVct(credentialId: string): string {
  const base = config.vctBaseUrl.replace(/\/$/, '');
  return `${base}/${credentialId}`;
}

// Credential type configurations - use getters to defer env var access
export const credentialTypes: Record<string, CredentialTypeConfig> = {
  employee_status: {
    id: 'EmployeeStatusCredential',
    name: 'Employee Status Credential',
    format: 'jwt_vc_json',
    department: 'hr',
    get profileId() { return buildProfileId(config.departments.hr, 'hr-issuer', 'employee'); },
    credentialConfigurationId: 'EmployeeStatusCredential',
  },
  photo_id: {
    id: PHOTO_ID_DOCTYPE,
    name: 'Photo ID (ISO 23220)',
    format: 'mso_mdoc',
    department: 'identity',
    doctype: PHOTO_ID_DOCTYPE,
    mdocNamespace: PHOTO_ID_NAMESPACE,
    get profileId() { return buildProfileId(config.departments.identity, 'identity-issuer', 'photo-id'); },
    credentialConfigurationId: PHOTO_ID_DOCTYPE,
  },
  address_proof: {
    id: 'AddressProofCredential',
    name: 'Address Proof Credential',
    format: 'jwt_vc_json',
    department: 'finance',
    get profileId() { return buildProfileId(config.departments.finance, 'finance-issuer', 'address'); },
    credentialConfigurationId: 'AddressProofCredential',
  },
  tax_registration: {
    id: 'tax_registration',
    name: 'Tax Registration Credential',
    format: 'dc+sd-jwt',
    department: 'revenue',
    get vct() { return buildVct('tax_registration'); },
    get profileId() { return buildProfileId(config.departments.revenue, 'revenue-issuer', 'tax'); },
    credentialConfigurationId: 'tax_registration',
  },
  bank_account: {
    id: 'BankAccountCredential',
    name: 'Bank Account Credential',
    format: 'jwt_vc_json',
    department: 'finance',
    get profileId() { return buildProfileId(config.departments.finance, 'finance-issuer', 'bank-account'); },
    credentialConfigurationId: 'BankAccountCredential',
  },
  untrusted_photo_id: {
    id: PHOTO_ID_DOCTYPE,
    name: 'Photo ID (ISO 23220)',
    format: 'mso_mdoc',
    department: 'untrusted',
    doctype: PHOTO_ID_DOCTYPE,
    mdocNamespace: PHOTO_ID_NAMESPACE,
    get profileId() { return buildProfileId(config.departments.untrusted, 'untrusted-issuer', 'photo-id'); },
    credentialConfigurationId: PHOTO_ID_DOCTYPE,
  },
};

export const issuerCards: IssuerCardConfig[] = [
  {
    id: 'hr',
    credentialKeys: ['employee_status'],
    get issuerTarget() { return buildIssuerTarget(config.departments.hr, 'hr-issuer'); },
    fallbackName: departments.hr.name,
    fallbackDescription: departments.hr.description,
    fallbackIcon: 'users',
    badges: [{ label: 'Employee Status', variant: 'outline' }],
  },
  {
    id: 'identity',
    credentialKeys: ['photo_id'],
    get issuerTarget() { return buildIssuerTarget(config.departments.identity, 'identity-issuer'); },
    fallbackName: departments.identity.name,
    fallbackDescription: departments.identity.description,
    fallbackIcon: 'file-text',
    badges: [
      { label: 'Photo ID', variant: 'outline' },
    ],
  },
  {
    id: 'revenue',
    credentialKeys: ['tax_registration'],
    get issuerTarget() { return buildIssuerTarget(config.departments.revenue, 'revenue-issuer'); },
    fallbackName: departments.revenue.name,
    fallbackDescription: departments.revenue.description,
    fallbackIcon: 'receipt',
    badges: [{ label: 'Tax Registration', variant: 'outline' }],
  },
  {
    id: 'finance',
    credentialKeys: ['bank_account', 'address_proof'],
    get issuerTarget() { return buildIssuerTarget(config.departments.finance, 'finance-issuer'); },
    fallbackName: departments.finance.name,
    fallbackDescription: departments.finance.description,
    fallbackIcon: 'credit-card',
    badges: [
      { label: 'Bank Account', variant: 'outline' },
      { label: 'Address Proof', variant: 'outline' },
    ],
  },
  {
    id: 'untrusted',
    credentialKeys: ['untrusted_photo_id'],
    get issuerTarget() { return buildIssuerTarget(config.departments.untrusted, 'untrusted-issuer'); },
    fallbackName: departments.untrusted.name,
    fallbackDescription: departments.untrusted.description,
    fallbackIcon: 'building',
    badges: [
      { label: 'Photo ID', variant: 'outline' },
      { label: 'Not in trust registry', variant: 'destructive' },
    ],
  },
];

export const verifierCards: Record<VerifierKind, VerifierCardConfig> = {
  trusted: {
    id: 'trusted',
    get verifierTarget() { return config.verifierTarget; },
    fallbackTitle: 'Trusted central verifier',
    fallbackDescription: 'Runs signature and ETSI trust-list policies against the trust registry.',
    fallbackIcon: 'shield-check',
    badge: 'Trust-list verified',
    badgeClassName: 'bg-green-600',
  },
  untrusted: {
    id: 'untrusted',
    get verifierTarget() { return config.untrustedVerifierTarget; },
    fallbackTitle: 'Untrusted verifier',
    fallbackDescription: 'Runs signature checks only because no trust registry is linked.',
    fallbackIcon: 'shield-check',
    badge: 'Signature only',
    badgeClassName: 'bg-amber-600',
  },
};

export function verifierTargetFor(verifierKind: VerifierKind): string {
  return verifierCards[verifierKind].verifierTarget;
}

export function verifierKeyReferenceFor(verifierKind: VerifierKind): string {
  if (verifierKind === 'untrusted') {
    return config.untrustedVerifierKeyReference;
  }
  return config.verifierKeyReference;
}

export function verificationPoliciesFor(verifierKind: VerifierKind) {
  if (verifierKind === 'untrusted') {
    return [{ policy: 'signature' }];
  }

  return [
    { policy: 'signature' },
    {
      policy: 'etsi-trust-list',
      expectedEntityType: 'PID_PROVIDER',
      allowStaleSource: true,
      requireAuthenticated: false,
    },
  ];
}

// Get credential configuration by type key
export function getCredentialConfig(type: string): CredentialTypeConfig | undefined {
  return credentialTypes[type];
}

// Get all credentials for a department
export function getCredentialsByDepartment(deptId: DepartmentId): CredentialTypeConfig[] {
  return Object.values(credentialTypes).filter(c => c.department === deptId);
}

// Get all available credential types
export function getAvailableCredentialTypes(): Array<{ key: string; config: CredentialTypeConfig }> {
  return Object.entries(credentialTypes).map(([key, config]) => ({ key, config }));
}
