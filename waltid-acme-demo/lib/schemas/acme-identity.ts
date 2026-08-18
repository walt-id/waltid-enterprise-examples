// Acme Identity Credential Schema
// Used for identity verification and authentication

export const acmeIdentityFields = [
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

export const acmeIdentityDefaultValues: Record<string, unknown> = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  idvComplete: 'false',
};

export const acmeIdentityClaims = [
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
