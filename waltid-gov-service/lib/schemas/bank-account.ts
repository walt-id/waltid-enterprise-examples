// Bank Account Credential Schema (jwt_vc_json)

export interface BankAccountData {
  accountNumber: string;
  accountType: string;
  bankName: string;
  accountHolder: string;
  verifiedDate: string;
}

export const bankAccountDefaultValues: BankAccountData = {
  accountNumber: 'DE89370400440532013000',
  accountType: 'Current',
  bankName: 'Demo Bank',
  accountHolder: 'Max Mustermann',
  verifiedDate: '2024-01-15',
};

export const bankAccountFields = [
  { key: 'accountNumber', label: 'Account Number (IBAN)', type: 'text' as const, required: true },
  { key: 'accountType', label: 'Account Type', type: 'text' as const, required: true },
  { key: 'bankName', label: 'Bank Name', type: 'text' as const, required: true },
  { key: 'accountHolder', label: 'Account Holder', type: 'text' as const, required: true },
  { key: 'verifiedDate', label: 'Verified Date', type: 'date' as const, required: true },
] as const;

export const bankAccountClaims = [
  { path: ['vc', 'credentialSubject', 'accountNumber'], label: 'Account Number' },
  { path: ['vc', 'credentialSubject', 'accountType'], label: 'Account Type' },
  { path: ['vc', 'credentialSubject', 'bankName'], label: 'Bank Name' },
  { path: ['vc', 'credentialSubject', 'accountHolder'], label: 'Account Holder' },
  { path: ['vc', 'credentialSubject', 'verifiedDate'], label: 'Verified Date' },
];
