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
  get vctBaseUrl() { return optionalEnv('GOV_VCT_BASE_URL', this.publicUrl); },
  departments: {
    get hr() { return optionalEnv('GOV_DEPT_HR', 'dept-hr'); },
    get identity() { return optionalEnv('GOV_DEPT_IDENTITY', 'dept-identity'); },
    get revenue() { return optionalEnv('GOV_DEPT_REVENUE', 'dept-revenue'); },
    get finance() { return optionalEnv('GOV_DEPT_FINANCE', 'dept-finance'); },
  },
};

// ISO 23220 Photo ID constants
export const PHOTO_ID_DOCTYPE = 'org.iso.23220.photoid.1';
export const PHOTO_ID_NAMESPACE = 'org.iso.23220.1';

// Credential format types
export type CredentialFormat = 'jwt_vc_json' | 'mso_mdoc' | 'dc+sd-jwt';

// Department identifiers
export type DepartmentId = 'hr' | 'identity' | 'revenue' | 'finance';

// Department configuration
export interface DepartmentInfo {
  id: DepartmentId;
  name: string;
  description: string;
  tenantId: string;
  issuerName: string;
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
    department: 'identity',
    get profileId() { return buildProfileId(config.departments.identity, 'identity-issuer', 'address'); },
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
};

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
