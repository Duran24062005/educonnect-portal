import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/users';

export const normalizeRoleLabel = (role?: string) => {
  if (!role) return 'Sin rol';
  const normalized = role.toLowerCase();
  if (normalized === 'admin') return 'Admin';
  if (normalized === 'teacher') return 'Teacher';
  if (normalized === 'student') return 'Student';
  return role;
};

const normalizeStatus = (status?: string) => {
  if (!status) return '—';
  return status.toLowerCase();
};

const normalizeUserRow = (user: any) => {
  const person = user?.person || user?.person_id || null;
  const role = normalizeRoleLabel(user?.role ?? person?.role);
  const status = normalizeStatus(user?.status ?? person?.status);
  return { ...user, person, role, status };
};

const findUsersArray = (value: any): any[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'object') return [];

  const directKeys = ['users', 'items', 'docs', 'results', 'rows', 'data'];
  for (const key of directKeys) {
    if (Array.isArray((value as any)[key])) return (value as any)[key];
  }

  for (const nested of Object.values(value)) {
    const found = findUsersArray(nested);
    if (found.length > 0) return found;
  }

  return [];
};

const parseUsersFromResponse = (response: any) => {
  const payload = response?.data;
  const usersList = findUsersArray(payload);
  return usersList.map(normalizeUserRow);
};

const fetchAllUsers = async () => {
  try {
    const response = await usersApi.list({ page: 1, limit: 1000 });
    const users = parseUsersFromResponse(response);
    if (users.length > 0) return users;
  } catch {
    // Fallback below
  }

  const fallbackResponse = await usersApi.list();
  const fallbackUsers = parseUsersFromResponse(fallbackResponse);

  const unique = new Map<string, any>();
  fallbackUsers.forEach((user) => {
    if (user?._id) unique.set(user._id, user);
  });
  return Array.from(unique.values());
};

export const useUsers = () => {
  const query = useQuery({
    queryKey: ['users', 'all'],
    queryFn: fetchAllUsers,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
