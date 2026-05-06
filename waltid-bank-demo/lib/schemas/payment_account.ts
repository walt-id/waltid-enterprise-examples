import { registerCredential } from '../credentials/registry';

export interface PaymentAccountCredentialData {
  iban: string;
  bic: string;
  currency: string;
  category: string;
}

export const paymentAccountDefaultValues: PaymentAccountCredentialData = {
  iban: 'BE68539007547034',
  bic: 'AXABBE22',
  currency: 'EUR',
  category: 'urn:eu:europa:ec:eudi:sua:sca'
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

export const paymentAccountCredentialType = {
  id: 'payment_account',
  name: 'SCA Payment Account (SD-JWT)',
  format: 'dc+sd-jwt' as const,
  vct: 'https://waltid.eudi-demo.enterprise.test.waltid.cloud/.well-known/vct/v2/waltid.tenant1.issuer4/issuer-service-api/openid4vci/payment_account',
  credentialConfigurationId: 'payment_account',
};

registerCredential('payment_account', {
  format: 'dc+sd-jwt',
  schema: {
    fields: [...paymentAccountFields] as Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'email' | 'tel'; required: boolean }>,
    defaultValues: { ...paymentAccountDefaultValues } as Record<string, unknown>,
  },
  mappings: {},
  sdjwtConfig: paymentAccountSDJWTConfig,
  claims: paymentAccountClaims,
});
