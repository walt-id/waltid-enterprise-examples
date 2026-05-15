export interface PaymentAccountCredentialData {
  iban: string;
  bic: string;
  currency: string;
  category: string;
}

export const paymentAccountDefaultValues: PaymentAccountCredentialData = {
  iban: 'DE89370400440532013000',
  bic: 'COBADEFFXXX',
  currency: 'EUR',
  category: 'personal',
};

export const paymentAccountFields = [
  { key: 'iban', label: 'IBAN', type: 'text' as const, required: true },
  { key: 'bic', label: 'BIC', type: 'text' as const, required: true },
  { key: 'currency', label: 'Currency', type: 'text' as const, required: true },
  { key: 'category', label: 'Category', type: 'text' as const, required: true },
] as const;

export const paymentAccountSDJWTConfig = {
  mapping: {
    id: '<uuid>',
    iat: '<timestamp-seconds>',
    nbf: '<timestamp-seconds>',
    exp: '<timestamp-in-seconds:365d>',
  },
  selectiveDisclosure: {
    fields: {
      iban: { sd: true },
      bic: { sd: true },
      currency: { sd: false },
      category: { sd: false },
    } as Record<string, { sd: boolean }>,
  },
};

export const paymentAccountClaims = [
  { path: ['iban'], label: 'IBAN', sd: true },
  { path: ['bic'], label: 'BIC', sd: true },
  { path: ['currency'], label: 'Currency', sd: false },
  { path: ['category'], label: 'Category', sd: false },
];

