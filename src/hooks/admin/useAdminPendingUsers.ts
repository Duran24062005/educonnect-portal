import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, type AdminUserRole, type AdminUserStatus } from '@/api/users';
import { asArray, unwrapPayload } from './utils';

export const ADMIN_ROLES: AdminUserRole[] = ['student', 'teacher', 'parent', 'admin', 'guardian'];
export const ADMIN_STATUSES: AdminUserStatus[] = ['active', 'pending', 'inactive', 'blocked', 'egresado'];

export const useAdminPendingUsers = () => {
  return useQuery({
    queryKey: ['admin', 'users', 'pending'],
    queryFn: async () => {
      const res = await usersApi.getPending();
      const payload = unwrapPayload(res.data);
      return asArray(payload, ['users']);
    },
    staleTime: 60_000,
  });
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin', 'users', 'all'],
    queryFn: async () => {
      const res = await usersApi.list({ page: 1, limit: 1000 });
      const payload = unwrapPayload(res.data);
      return asArray(payload, ['users']);
    },
    staleTime: 60_000,
  });
};

export const useApproveUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminUserRole }) => usersApi.approve(id, role),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'users', 'pending'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'users', 'all'] }),
        qc.invalidateQueries({ queryKey: ['users', 'all'] }),
      ]);
    },
  });
};

export const useChangeUserStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminUserStatus }) => usersApi.changeStatus(id, status),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'users', 'pending'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'users', 'all'] }),
        qc.invalidateQueries({ queryKey: ['users', 'all'] }),
      ]);
    },
  });
};
