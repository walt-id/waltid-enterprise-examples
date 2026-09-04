export interface TaxRegistrationCertData {
 // linkedUid: string;
  taxpayerIdentificationNumber: string;
  taxpayerName: string;
  taxOfficeBranch: string;
  registrationDate: string;
  taxpayerStatus: string;
}

export const taxRegistrationCertDefaultValues: TaxRegistrationCertData = {
  //linkedUid: '123456789012',
  taxpayerIdentificationNumber: 'TIN-9876543210',
  taxpayerName: 'John Doe',
  taxOfficeBranch: 'Central Tax Office',
  registrationDate: '2026-01-15',
  taxpayerStatus: 'Active / Compliant',
};

export const taxRegistrationCertFields = [
  { key: 'linkedUid', label: 'Linked UID', type: 'text' as const, required: true },
  { key: 'taxpayerIdentificationNumber', label: 'TIN', type: 'text' as const, required: true },
  { key: 'taxpayerName', label: 'Taxpayer Name', type: 'text' as const, required: true },
  { key: 'taxOfficeBranch', label: 'Tax Office Branch', type: 'text' as const, required: true },
  { key: 'registrationDate', label: 'Registration Date', type: 'date' as const, required: true },
  { key: 'taxpayerStatus', label: 'Taxpayer Status', type: 'text' as const, required: true },
] as const;

export const taxRegistrationCertClaims = [
  { path: ['vc', 'credentialSubject', 'taxpayerIdentificationNumber'], label: 'TIN' },
  { path: ['vc', 'credentialSubject', 'taxpayerName'], label: 'Taxpayer Name' },
  { path: ['vc', 'credentialSubject', 'taxOfficeBranch'], label: 'Tax Office Branch' },
  { path: ['vc', 'credentialSubject', 'registrationDate'], label: 'Registration Date' },
  { path: ['vc', 'credentialSubject', 'taxpayerStatus'], label: 'Taxpayer Status' },
  { path: ['vc', 'credentialSubject', 'linkedUid'], label: 'Linked UID' },
];
