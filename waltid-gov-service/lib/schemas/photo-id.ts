// Photo ID Credential Schema (mso_mdoc - ISO 23220)
import { PHOTO_ID_NAMESPACE } from '../config';

export interface PhotoIdData {
  family_name: string;
  given_name: string;
  birth_date: string;
  portrait?: string;
  issuing_authority: string;
  issuing_country: string;
  document_number: string;
  issue_date: string;
  expiry_date: string;
  nationality: string;
}

export const photoIdDefaultValues: PhotoIdData = {
  family_name: 'Mustermann',
  given_name: 'Max',
  birth_date: '1985-03-15',
  portrait: '',
  issuing_authority: 'Government Identity Services',
  issuing_country: 'DE',
  document_number: 'ID-2024-001234',
  issue_date: '2024-01-15',
  expiry_date: '2034-01-15',
  nationality: 'DE',
};

export const photoIdFields = [
  { key: 'family_name', label: 'Family Name', type: 'text' as const, required: true },
  { key: 'given_name', label: 'Given Name', type: 'text' as const, required: true },
  { key: 'birth_date', label: 'Birth Date', type: 'date' as const, required: true },
  { key: 'document_number', label: 'Document Number', type: 'text' as const, required: true },
  { key: 'issue_date', label: 'Issue Date', type: 'date' as const, required: true },
  { key: 'expiry_date', label: 'Expiry Date', type: 'date' as const, required: true },
  { key: 'issuing_authority', label: 'Issuing Authority', type: 'text' as const, required: true },
  { key: 'issuing_country', label: 'Issuing Country', type: 'text' as const, required: true },
  { key: 'nationality', label: 'Nationality', type: 'text' as const, required: true },
] as const;

// Claims use the ISO 23220 namespace
export const photoIdClaims = [
  { path: [PHOTO_ID_NAMESPACE, 'family_name'], label: 'Family Name' },
  { path: [PHOTO_ID_NAMESPACE, 'given_name'], label: 'Given Name' },
  { path: [PHOTO_ID_NAMESPACE, 'birth_date'], label: 'Birth Date' },
  { path: [PHOTO_ID_NAMESPACE, 'document_number'], label: 'Document Number' },
  { path: [PHOTO_ID_NAMESPACE, 'issue_date'], label: 'Issue Date' },
  { path: [PHOTO_ID_NAMESPACE, 'expiry_date'], label: 'Expiry Date' },
  { path: [PHOTO_ID_NAMESPACE, 'issuing_authority'], label: 'Issuing Authority' },
  { path: [PHOTO_ID_NAMESPACE, 'issuing_country'], label: 'Issuing Country' },
  { path: [PHOTO_ID_NAMESPACE, 'nationality'], label: 'Nationality' },
];

// Data mapping for mso_mdoc date conversions
export const photoIdDataMapping = {
  [PHOTO_ID_NAMESPACE]: {
    entriesConfigMap: {
      birth_date: {
        type: 'string',
        conversionType: 'stringToFullDate',
      },
      issue_date: {
        type: 'string',
        conversionType: 'stringToFullDate',
      },
      expiry_date: {
        type: 'string',
        conversionType: 'stringToFullDate',
      },
    },
  },
};
