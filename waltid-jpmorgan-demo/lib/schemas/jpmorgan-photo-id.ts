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
    key: 'employeeId',
    label: 'Employee ID',
    type: 'text' as const,
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
  employeeId: '',
  idvComplete: false,
};

// Claims mapping for mDoc Photo ID (using mDoc element names)
export const jpmorganPhotoIdClaims = [
  {
    path: ['given_name'],
    label: 'Given Name',
  },
  {
    path: ['family_name'],
    label: 'Family Name',
  },
  {
    path: ['date_of_birth'],
    label: 'Date of Birth',
  },
  {
    path: ['employee_id'],
    label: 'Employee ID',
  },
  {
    path: ['idv_complete'],
    label: 'Identity Verification Complete',
  },
];
