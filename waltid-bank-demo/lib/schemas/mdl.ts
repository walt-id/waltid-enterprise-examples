// MDL (Mobile Driving Licence) Schema

export interface DrivingPrivilege {
  vehicle_category_code: string;
  issue_date: string;
  expiry_date: string;
}

export interface MDLData {
  family_name: string;
  given_name: string;
  birth_date: string;
  issue_date: string;
  expiry_date: string;
  issuing_country: string;
  issuing_authority: string;
  document_number: string;
  driving_privileges: DrivingPrivilege[];
  un_distinguishing_sign: string;
  resident_address: string;
}

export const mdlDefaultValues: MDLData = {
  family_name: 'Mustermann',
  given_name: 'Max',
  birth_date: '1985-03-15',
  issue_date: '2024-01-01',
  expiry_date: '2034-01-01',
  issuing_country: 'DE',
  issuing_authority: 'Demo Führerscheinstelle',
  document_number: 'B071234567890',
  driving_privileges: [
    {
      vehicle_category_code: 'B',
      issue_date: '2024-01-01',
      expiry_date: '2034-01-01',
    },
  ],
  un_distinguishing_sign: 'D',
  resident_address: 'Musterstraße 123, Berlin, Germany',
};

export const mdlFields = [
  { key: 'family_name', label: 'Family Name', type: 'text', required: true },
  { key: 'given_name', label: 'Given Name', type: 'text', required: true },
  { key: 'birth_date', label: 'Birth Date', type: 'date', required: true },
  { key: 'issue_date', label: 'Issue Date', type: 'date', required: true },
  { key: 'expiry_date', label: 'Expiry Date', type: 'date', required: true },
  { key: 'issuing_country', label: 'Issuing Country', type: 'text', required: true },
  { key: 'issuing_authority', label: 'Issuing Authority', type: 'text', required: true },
  { key: 'document_number', label: 'Document Number', type: 'text', required: true },
  { key: 'un_distinguishing_sign', label: 'UN Distinguishing Sign', type: 'text', required: true },
  { key: 'resident_address', label: 'Resident Address', type: 'text', required: true },
] as const;

export const mdlClaims = [
  { path: ['org.iso.18013.5.1', 'family_name'], label: 'Family Name' },
  { path: ['org.iso.18013.5.1', 'given_name'], label: 'Given Name' },
  { path: ['org.iso.18013.5.1', 'birth_date'], label: 'Birth Date' },
  { path: ['org.iso.18013.5.1', 'expiry_date'], label: 'Expiry Date' },
  { path: ['org.iso.18013.5.1', 'issuing_country'], label: 'Issuing Country' },
  { path: ['org.iso.18013.5.1', 'issuing_authority'], label: 'Issuing Authority' },
  { path: ['org.iso.18013.5.1', 'document_number'], label: 'Document Number' },
  { path: ['org.iso.18013.5.1', 'driving_privileges'], label: 'Driving Privileges' },
  { path: ['org.iso.18013.5.1', 'resident_address'], label: 'Resident Address' },
];

export const mdlIdTokenMapping = {
  "$.family_name": "$.['org.iso.18013.5.1'].family_name",
  "$.given_name": "$.['org.iso.18013.5.1'].given_name",
};

export const mdlDataMapping = {
  "org.iso.18013.5.1": {
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
      },
      "portrait": {
        "type": "string",
        "conversionType": "base64StringToByteString"
      },
      "driving_privileges": {
        "type": "array",
        "arrayConfig": [
          {
            "type": "object",
            "entriesConfigMap": {
              "issue_date": {
                "type": "string",
                "conversionType": "stringToFullDate"
              },
              "expiry_date": {
                "type": "string",
                "conversionType": "stringToFullDate"
              }
            }
          },
          {
            "type": "object",
            "entriesConfigMap": {
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
        ]
      }
    }
  }
};
