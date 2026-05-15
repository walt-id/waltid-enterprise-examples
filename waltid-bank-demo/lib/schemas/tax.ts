export interface TaxCredentialData {
  tax_id: string;
  tax_number: string;
  tax_assessment_year: string;
  annual_income: string;
  tax_class: string;
  employer_name: string;
  employment_start_date: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  phone_number?: string;
  address?: {
    street_address: string;
    locality: string;
    region: string;
    country: string;
  };
  birthdate?: string;
  is_over_18?: boolean;
  is_over_21?: boolean;
  is_over_65?: boolean;
}

export const taxCredentialDefaultValues: TaxCredentialData = {
  tax_id: '12345678901',
  tax_number: '918273645',
  tax_assessment_year: '2024',
  annual_income: '65000',
  tax_class: 'I',
  employer_name: 'Muster GmbH',
  employment_start_date: '2020-03-01',
  given_name: 'Max',
  family_name: 'Mustermann',
  email: 'max.mustermann@example.com',
  phone_number: '+49-30-12345678',
  address: {
    street_address: 'Musterstraße 123',
    locality: 'Berlin',
    region: 'Berlin',
    country: 'DE',
  },
  birthdate: '1985-03-15',
  is_over_18: true,
  is_over_21: true,
  is_over_65: false,
};

export const taxCredentialFields = [
  { key: 'given_name', label: 'Vorname', type: 'text' as const, required: true },
  { key: 'family_name', label: 'Nachname', type: 'text' as const, required: true },
  { key: 'email', label: 'E-Mail', type: 'email' as const, required: true },
  { key: 'phone_number', label: 'Telefonnummer', type: 'tel' as const, required: false },
  { key: 'tax_id', label: 'Steuer-ID', type: 'text' as const, required: true },
  { key: 'tax_number', label: 'Steuernummer', type: 'text' as const, required: true },
  { key: 'tax_assessment_year', label: 'Veranlagungsjahr', type: 'text' as const, required: true },
  { key: 'annual_income', label: 'Jahreseinkommen (EUR)', type: 'number' as const, required: true },
  { key: 'tax_class', label: 'Steuerklasse', type: 'text' as const, required: true },
  { key: 'employer_name', label: 'Arbeitgeber', type: 'text' as const, required: true },
  { key: 'employment_start_date', label: 'Beschäftigt seit', type: 'date' as const, required: true },
  { key: 'birthdate', label: 'Geburtsdatum', type: 'date' as const, required: false },
] as const;

// SD-JWT specific configuration
export const taxCredentialSDJWTConfig = {
  mapping: {
    id: '<uuid>',
    iat: '<timestamp-seconds>',
    nbf: '<timestamp-seconds>',
    exp: '<timestamp-in-seconds:365d>',
  },
  selectiveDisclosure: {
    fields: {
      tax_id: { sd: true },
      tax_number: { sd: true },
      annual_income: { sd: true },
      tax_class: { sd: true },
      employer_name: { sd: true },
      employment_start_date: { sd: true },
      birthdate: { sd: true },
      given_name: { sd: false },
      family_name: { sd: false },
      email: { sd: false },
      phone_number: { sd: true },
      is_over_18: { sd: false },
      is_over_21: { sd: false },
      is_over_65: { sd: false },
    } as Record<string, { sd: boolean }>,
  },
};

// ID token mapping for auth code flow
export const taxCredentialIdTokenMapping = {
  '$.given_name': '$.given_name',
  '$.family_name': '$.family_name',
  '$.email': '$.email',
};

// Claims for verification
export const taxCredentialClaims = [
  { path: ['tax_id'], label: 'Steuer-ID', sd: true },
  { path: ['tax_number'], label: 'Steuernummer', sd: true },
  { path: ['tax_assessment_year'], label: 'Veranlagungsjahr', sd: false },
  { path: ['annual_income'], label: 'Jahreseinkommen', sd: true },
  { path: ['tax_class'], label: 'Steuerklasse', sd: true },
  { path: ['employer_name'], label: 'Arbeitgeber', sd: true },
  { path: ['employment_start_date'], label: 'Beschäftigt seit', sd: true },
  { path: ['given_name'], label: 'Vorname', sd: false },
  { path: ['family_name'], label: 'Nachname', sd: false },
  { path: ['is_over_18'], label: 'Über 18', sd: false },
];

export const taxCredentialType = {
  id: 'tax_credential',
  name: 'German Tax Credential (SD-JWT)',
  format: 'dc+sd-jwt' as const,
  vct: 'https://vc-registry.com/vct/registry/publish/XZkuEyrDtP2L378Ky9KN7FKh0_xqSpcG29UoQh-MrFw',
  credentialConfigurationId: 'tax_credential',
};
