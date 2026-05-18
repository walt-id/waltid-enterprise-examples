// Tax Registration Credential Schema (dc+sd-jwt)

export interface TaxRegistrationData {
  tax_id: string;
  tax_number: string;
  tax_assessment_year: string;
  annual_income: string;
  tax_class: string;
  status: string;
  valid_until: string;
  given_name: string;
  family_name: string;
  birthdate: string;
}

export const taxRegistrationDefaultValues: TaxRegistrationData = {
  tax_id: '123/456/78901',
  tax_number: '918273645',
  tax_assessment_year: '2024',
  annual_income: '65000',
  tax_class: 'I',
  status: 'Compliant',
  valid_until: '2025-12-31',
  given_name: 'Max',
  family_name: 'Mustermann',
  birthdate: '1985-03-15',
};

export const taxRegistrationFields = [
  { key: 'tax_id', label: 'Tax ID', type: 'text' as const, required: true },
  { key: 'tax_number', label: 'Tax Number', type: 'text' as const, required: true },
  { key: 'tax_assessment_year', label: 'Assessment Year', type: 'text' as const, required: true },
  { key: 'annual_income', label: 'Annual Income', type: 'text' as const, required: false },
  { key: 'tax_class', label: 'Tax Class', type: 'text' as const, required: true },
  { key: 'status', label: 'Status', type: 'text' as const, required: true },
  { key: 'valid_until', label: 'Valid Until', type: 'date' as const, required: true },
  { key: 'given_name', label: 'Given Name', type: 'text' as const, required: true },
  { key: 'family_name', label: 'Family Name', type: 'text' as const, required: true },
  { key: 'birthdate', label: 'Birth Date', type: 'date' as const, required: false },
] as const;

// SD-JWT claims use flat paths (no vc.credentialSubject wrapper)
export const taxRegistrationClaims = [
  { path: ['tax_id'], label: 'Tax ID', sd: true },
  { path: ['tax_number'], label: 'Tax Number', sd: true },
  { path: ['tax_assessment_year'], label: 'Assessment Year', sd: false },
  { path: ['annual_income'], label: 'Annual Income', sd: true },
  { path: ['tax_class'], label: 'Tax Class', sd: false },
  { path: ['status'], label: 'Status', sd: false },
  { path: ['valid_until'], label: 'Valid Until', sd: false },
  { path: ['given_name'], label: 'Given Name', sd: true },
  { path: ['family_name'], label: 'Family Name', sd: true },
  { path: ['birthdate'], label: 'Birth Date', sd: true },
];

export const taxRegistrationSDJWTConfig = {
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
      given_name: { sd: true },
      family_name: { sd: true },
      birthdate: { sd: true },
      tax_assessment_year: { sd: false },
      tax_class: { sd: false },
      status: { sd: false },
      valid_until: { sd: false },
    } as Record<string, { sd: boolean }>,
  },
};
