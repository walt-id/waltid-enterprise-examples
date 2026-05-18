// Employee Status Credential Schema (jwt_vc_json)

export interface EmployeeStatusData {
  employeeId: string;
  department: string;
  position: string;
  clearanceLevel: string;
  startDate: string;
}

export const employeeStatusDefaultValues: EmployeeStatusData = {
  employeeId: 'EMP-2024-001',
  department: 'Central Government',
  position: 'Senior Analyst',
  clearanceLevel: 'Confidential',
  startDate: '2020-03-15',
};

export const employeeStatusFields = [
  { key: 'employeeId', label: 'Employee ID', type: 'text' as const, required: true },
  { key: 'department', label: 'Department', type: 'text' as const, required: true },
  { key: 'position', label: 'Position', type: 'text' as const, required: true },
  { key: 'clearanceLevel', label: 'Clearance Level', type: 'text' as const, required: true },
  { key: 'startDate', label: 'Start Date', type: 'date' as const, required: true },
] as const;

export const employeeStatusClaims = [
  { path: ['vc', 'credentialSubject', 'employeeId'], label: 'Employee ID' },
  { path: ['vc', 'credentialSubject', 'department'], label: 'Department' },
  { path: ['vc', 'credentialSubject', 'position'], label: 'Position' },
  { path: ['vc', 'credentialSubject', 'clearanceLevel'], label: 'Clearance Level' },
  { path: ['vc', 'credentialSubject', 'startDate'], label: 'Start Date' },
];
