// Address Proof Credential Schema (jwt_vc_json)

export interface AddressProofData {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  validFrom: string;
}

export const addressProofDefaultValues: AddressProofData = {
  street: 'Musterstraße 123',
  city: 'Berlin',
  postalCode: '10115',
  country: 'DE',
  validFrom: '2024-01-01',
};

export const addressProofFields = [
  { key: 'street', label: 'Street Address', type: 'text' as const, required: true },
  { key: 'city', label: 'City', type: 'text' as const, required: true },
  { key: 'postalCode', label: 'Postal Code', type: 'text' as const, required: true },
  { key: 'country', label: 'Country', type: 'text' as const, required: true },
  { key: 'validFrom', label: 'Valid From', type: 'date' as const, required: true },
] as const;

export const addressProofClaims = [
  { path: ['vc', 'credentialSubject', 'street'], label: 'Street Address' },
  { path: ['vc', 'credentialSubject', 'city'], label: 'City' },
  { path: ['vc', 'credentialSubject', 'postalCode'], label: 'Postal Code' },
  { path: ['vc', 'credentialSubject', 'country'], label: 'Country' },
  { path: ['vc', 'credentialSubject', 'validFrom'], label: 'Valid From' },
];
