export type NormalizedRole = 'admin' | 'teacher' | 'student' | 'parent';
export type ApiRole = NormalizedRole | 'guardian';
export type AccountStatus = 'active' | 'pending' | 'inactive' | 'blocked' | 'egresado';

export const normalizeRole = (role?: string | null): NormalizedRole | undefined => {
  if (!role) return undefined;

  const normalized = role.toLowerCase();
  if (normalized === 'guardian') return 'parent';
  if (normalized === 'admin' || normalized === 'teacher' || normalized === 'student' || normalized === 'parent') {
    return normalized;
  }

  return undefined;
};

export const normalizeStatus = (status?: string | null): AccountStatus | undefined => {
  if (!status) return undefined;
  const normalized = status.toLowerCase();
  if (['active', 'pending', 'inactive', 'blocked', 'egresado'].includes(normalized)) {
    return normalized as AccountStatus;
  }
  return undefined;
};

export const getRoleLabel = (role?: string | null) => {
  switch (normalizeRole(role)) {
    case 'admin':
      return 'Admin';
    case 'teacher':
      return 'Teacher';
    case 'student':
      return 'Student';
    case 'parent':
      return 'Parent/Acudiente';
    default:
      return role || 'Sin rol';
  }
};

export const getDashboardLabel = (role?: string | null) => {
  switch (normalizeRole(role)) {
    case 'admin':
      return 'Administración';
    case 'teacher':
      return 'Docente';
    case 'student':
      return 'Estudiante';
    case 'parent':
      return 'Acudiente';
    default:
      return 'Usuario';
  }
};

export const isBlockedAccountStatus = (status?: string | null) =>
  ['pending', 'inactive', 'blocked'].includes(normalizeStatus(status) ?? '');
