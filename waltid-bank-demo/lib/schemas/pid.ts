// PID (Person Identification Data) Schema

export interface PIDData {
  family_name: string;
  given_name: string;
  nationality: string;
  birth_date: string;
  issue_date: string;
  expiry_date: string;
}

export const pidDefaultValues: PIDData = {
  family_name: 'Janssens',
  given_name: 'Marc',
  nationality: 'BE',
  birth_date: '1990-01-15',
  issue_date: '2024-01-01',
  expiry_date: '2029-01-01',
};

export const pidFields = [
  { key: 'family_name', label: 'Family Name', type: 'text', required: true },
  { key: 'given_name', label: 'Given Name', type: 'text', required: true },
  { key: 'nationality', label: 'Nationality', type: 'text', required: true },
  { key: 'birth_date', label: 'Birth Date', type: 'date', required: true },
  { key: 'issue_date', label: 'Issue Date', type: 'date', required: true },
  { key: 'expiry_date', label: 'Expiry Date', type: 'date', required: true },
] as const;

export const pidClaims = [
  { path: ['eu.europa.ec.eudi.pid.1', 'family_name'], label: 'Family Name' },
  { path: ['eu.europa.ec.eudi.pid.1', 'given_name'], label: 'Given Name' },
  { path: ['eu.europa.ec.eudi.pid.1', 'birth_date'], label: 'Birth Date' },
  { path: ['eu.europa.ec.eudi.pid.1', 'nationality'], label: 'Nationality' },
  { path: ['eu.europa.ec.eudi.pid.1', 'expiry_date'], label: 'Expiry Date' },
  { path: ['eu.europa.ec.eudi.pid.1', 'issuing_authority'], label: 'Issuing Authority' },
  { path: ['eu.europa.ec.eudi.pid.1', 'issuing_country'], label: 'Issuing Country' },
];

export const pidIdTokenMapping = {
  "$.family_name": "$.['eu.europa.ec.eudi.pid.1'].family_name",
  "$.given_name": "$.['eu.europa.ec.eudi.pid.1'].given_name",
};

export const pidDataMapping = {
  "eu.europa.ec.eudi.pid.1": {
    "entriesConfigMap": {
      "birth_date": {
        "type": "string",
        "conversionType": "stringToFullDate"
      },
      "issue_date": {
        "type": "string",
        "conversionType": "stringToFullDate"
      },
      "expiry_date": {
        "type": "string",
        "conversionType": "stringToFullDate"
      }
    }
  }
};
