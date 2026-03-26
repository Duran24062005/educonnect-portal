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
  const limit =
    pagination?.limit ??
    pagination?.page_size ??
    pagination?.pageSize ??
    payload?.limit ??
    payload?.page_size ??
    payload?.pageSize;

  return {
    total: typeof total === 'number' ? total : 0,
    pages: typeof pages === 'number' ? pages : 1,
    currentPage: typeof currentPage === 'number' ? currentPage : 1,
    limit: typeof limit === 'number' ? limit : undefined,
  };
};

type UseUsersParams = {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  status?: string;
};

const fetchUsersPage = async ({ page, limit, search, role, status }: UseUsersParams) => {
  const response = await usersApi.list({
    page,
    limit,
    search: search?.trim() || undefined,
    role: role && role !== 'all' ? role : undefined,
    status: status && status !== 'all' ? status : undefined,
  });

  return {
    users: findUsersArray(response?.data).map(normalizeUserRow),
    pagination: getPaginationMeta(response),
  };
};

export const useUsers = ({ page, limit, search, role, status }: UseUsersParams) => {
  const query = useQuery({
    queryKey: ['users', 'list', page, limit, search?.trim() || '', role || 'all', status || 'all'],
    queryFn: () => fetchUsersPage({ page, limit, search, role, status }),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: (previousData) => previousData,
  });

  return {
    users: query.data?.users ?? [],
    pagination: query.data?.pagination ?? {
      total: 0,
      pages: 1,
      currentPage: page,
      limit,
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
