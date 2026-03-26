import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { getRoleLabel, normalizeRole } from '@/lib/auth';

export const normalizeRoleLabel = (role?: string) => getRoleLabel(role);

const normalizeStatus = (status?: string) => {
  if (!status) return '—';
  return status.toLowerCase();
};

const normalizeUserRow = (user: any) => {
  const person = user?.person || user?.person_id || null;
  const role = normalizeRole(user?.role ?? person?.role) ?? user?.role ?? person?.role;
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

const getPaginationMeta = (response: any) => {
  const payload = response?.data?.data ?? response?.data ?? {};
  const pagination = payload?.pagination ?? {};
  const total =
    pagination?.total ??
    pagination?.count ??
    payload?.total ??
    payload?.count;
  const pages =
    pagination?.pages ??
    pagination?.total_pages ??
    pagination?.totalPages ??
    payload?.pages ??
    payload?.total_pages ??
    payload?.totalPages;
  const currentPage =
    pagination?.current_page ??
    pagination?.currentPage ??
    payload?.current_page ??
    payload?.currentPage;

  return {
    total: typeof total === 'number' ? total : undefined,
    pages: typeof pages === 'number' ? pages : undefined,
    currentPage: typeof currentPage === 'number' ? currentPage : undefined,
  };
};

const fetchAllUsers = async () => {
  const pageSize = 50;
  let page = 1;
  let hasMore = true;
  const all: any[] = [];

  while (hasMore) {
    const response = await usersApi.list({ page, limit: pageSize });
    const chunk = parseUsersFromResponse(response);
    all.push(...chunk);

    const meta = getPaginationMeta(response);
    if (meta.pages && meta.currentPage) hasMore = meta.currentPage < meta.pages;
    else if (meta.pages) hasMore = page < meta.pages;
    else if (meta.total !== undefined) hasMore = all.length < meta.total;
    else hasMore = chunk.length === pageSize;

    page += 1;
    if (page > 100) hasMore = false;
  }

  const unique = new Map<string, any>();
  all.forEach((user) => {
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
    retry: 1,
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
