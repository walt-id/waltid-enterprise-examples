export interface NationalMobileIdData {
  uidNumber: string;
  nativeName: string;
  nameEnglish: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  address: string;
  nationalIdNumber: string;
  is_over_18: string;
  qr_data: string;
}

export const DEMO_USERS: Record<string, NationalMobileIdData> = {
  'ID-POC-000001': {
    uidNumber: '100000000001',
    nativeName: 'جان دو',
    nameEnglish: 'John Doe',
    dateOfBirth: '1990-06-15',
    gender: 'Male',
    nationality: 'Citizen',
    address: '123 Main Street, Capital City',
    nationalIdNumber: 'ID-POC-000001',
    is_over_18: 'true',
    qr_data: 'ID-POC-000001|John Doe|1990-06-15|Male|Citizen|123 Main Street, Capital City|true',
  },
  'ID-POC-000002': {
    uidNumber: '100000000002',
    nativeName: 'خالد',
    nameEnglish: 'Khaled',
    dateOfBirth: '1995-03-22',
    gender: 'Male',
    nationality: 'Citizen',
    address: '456 Central Avenue, East District',
    nationalIdNumber: 'ID-POC-000002',
    is_over_18: 'true',
    qr_data: 'ID-POC-000002|Khaled|1995-03-22|Male|Citizen|456 Central Avenue, East District|true',
  },
  'ID-POC-000003': {
    uidNumber: '100000000003',
    nativeName: 'Alice',
    nameEnglish: 'Alice',
    dateOfBirth: '1998-11-08',
    gender: 'Female',
    nationality: 'Citizen',
    address: '789 North Boulevard, West Quarter',
    nationalIdNumber: 'ID-POC-000003',
    is_over_18: 'true',
    qr_data: 'ID-POC-000003|Alice|1998-11-08|Female|Citizen|789 North Boulevard, West Quarter|true',
  },
};

export const nationalMobileIdDefaultValues: NationalMobileIdData = DEMO_USERS['ID-POC-000001'];

export const nationalMobileIdFields = [
 // { key: 'uidNumber',       label: 'UID Number',        type: 'text' as const,  required: true },
  { key: 'nativeName',      label: 'Native Name',        type: 'text' as const,  required: true },
  { key: 'nameEnglish',     label: 'Name (English)',     type: 'text' as const,  required: true },
  { key: 'dateOfBirth',     label: 'Date of Birth',      type: 'date' as const,  required: true },
  { key: 'gender',          label: 'Gender',             type: 'text' as const,  required: true },
  { key: 'nationality',     label: 'Nationality',        type: 'text' as const,  required: true },
  { key: 'address',         label: 'Address',            type: 'text' as const,  required: true },
  { key: 'nationalIdNumber', label: 'National ID Number', type: 'text' as const,  required: true },
  { key: 'is_over_18',      label: 'Is Over 18',         type: 'text' as const,  required: true },
  { key: 'qr_data',         label: 'QR Data (VDS)',      type: 'text' as const,  required: true },
] as const;

export const nationalMobileIdClaims = [
 // { path: ['vc', 'credentialSubject', 'uidNumber'],       label: 'UID Number' },
  { path: ['vc', 'credentialSubject', 'nativeName'],      label: 'Native Name' },
  { path: ['vc', 'credentialSubject', 'nameEnglish'],     label: 'Name (English)' },
  { path: ['vc', 'credentialSubject', 'dateOfBirth'],     label: 'Date of Birth' },
  { path: ['vc', 'credentialSubject', 'gender'],          label: 'Gender' },
  { path: ['vc', 'credentialSubject', 'nationality'],     label: 'Nationality' },
  { path: ['vc', 'credentialSubject', 'address'],         label: 'Address' },
  { path: ['vc', 'credentialSubject', 'nationalIdNumber'], label: 'National ID Number' },
  { path: ['vc', 'credentialSubject', 'is_over_18'],      label: 'Is Over 18' },
  { path: ['vc', 'credentialSubject', 'qr_data'],         label: 'QR Data (VDS)' },
];
