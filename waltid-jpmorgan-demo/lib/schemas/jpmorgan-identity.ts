// JPMorgan Identity Credential Schema
// Used for identity verification and authentication

export const jpmorganIdentityFields = [
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
    key: 'idvComplete',
    label: 'IDV Complete',
    type: 'text' as const,
    required: true,
  },
];

export const jpmorganIdentityDefaultValues: Record<string, unknown> = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  idvComplete: 'false',
};

export const jpmorgaranIdentityClaims = [
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
