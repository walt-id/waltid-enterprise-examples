// JPMorgan Photo ID Schema
// W3C VC format credential for photo ID verification

export const jpmorganPhotoIdFields = [
  {
    key: 'firstName',
    label: 'First Name',
    type: 'text' as const,
    required: true,
  },
  {
    key: 'lastName',
    label: 'Last Name',
    type: 'text' as const,
    required: true,
  },
  {
    key: 'dateOfBirth',
    label: 'Date of Birth',
    type: 'date' as const,
    required: true,
  },
  {
    key: 'issueDate',
    label: 'Issue Date',
    type: 'date' as const,
    required: true,
  },
  {
    key: 'expiryDate',
    label: 'Expiry Date',
    type: 'date' as const,
    required: true,
  },
  {
    key: 'idvComplete',
    label: 'IDV Complete',
    type: 'text' as const,
    required: true,
  },
];

export const jpmorganPhotoIdDefaultValues: Record<string, unknown> = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  idvComplete: false,
};

// Claims mapping for W3C VC Photo ID
export const jpmorganPhotoIdClaims = [
  {
    path: ['firstName'],
    label: 'First Name',
  },
  {
    path: ['lastName'],
    label: 'Last Name',
  },
  {
    path: ['dateOfBirth'],
    label: 'Date of Birth',
  },
  {
    path: ['idvComplete'],
    label: 'Identity Verification Complete',
  },
];
