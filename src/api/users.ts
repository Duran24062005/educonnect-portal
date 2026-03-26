import api from './axios';
import { assertObjectId } from '@/lib/object-id';
import { createClientError } from '@/lib/http';

const toApiRole = (role?: string) => (role ? role.toLowerCase() : role);

const VALID_ROLES = ['student', 'teacher', 'admin', 'parent', 'guardian'] as const;
const VALID_STATUSES = ['active', 'pending', 'inactive', 'blocked', 'egresado'] as const;

export type AdminUserRole = (typeof VALID_ROLES)[number];
export type AdminUserStatus = 'active' | 'pending' | 'inactive' | 'blocked' | 'egresado';

const validateRole = (role?: string) => {
  if (!role || role === 'all') return role;
  const normalized = toApiRole(role);
  if (!VALID_ROLES.includes(normalized as AdminUserRole)) {
    throw createClientError('Invalid request input', [
      { location: 'query', path: ['role'], message: 'role must be a valid enum value' },
    ]);
  }
  return normalized;
};

const validateStatus = (status?: string) => {
  if (!status || status === 'all') return status;
  const normalized = status.toLowerCase();
  if (!VALID_STATUSES.includes(normalized as AdminUserStatus)) {
    throw createClientError('Invalid request input', [
      { location: 'query', path: ['status'], message: 'status must be a valid enum value' },
    ]);
  }
  return normalized;
};

const toInt = (value?: number) => {
  if (typeof value !== 'number') return value;
  return Math.trunc(value);
};

export const usersApi = {
  list: (params?: { role?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const normalizedParams = params
      ? {
          ...params,
          page: toInt(params.page),
          limit: toInt(params.limit),
          role: validateRole(params.role),
          status: validateStatus(params.status),
          _ts: Date.now(),
        }
      : params;
    return api.get('/api/users', {
      params: normalizedParams,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  },
  listByRole: (role: string, params?: { page?: number; limit?: number }) =>
    api.get(`/api/users/role/${validateRole(role)}`, {
      params: {
        page: toInt(params?.page),
        limit: toInt(params?.limit),
      },
    }),
  get: (id: string) => api.get(`/api/users/${assertObjectId(id, 'id')}`),
  update: (id: string, data: any) => api.put(`/api/users/${assertObjectId(id, 'id')}`, data),
  uploadPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('profile_photo', file);
    return api.patch(`/api/users/${assertObjectId(id, 'id')}/profile-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getPending: () => api.get('/api/users/admin/pending'),
  approve: (id: string, role: AdminUserRole) =>
    api.post(`/api/users/${assertObjectId(id, 'id')}/approve`, { role: validateRole(role) }),
  changeStatus: (id: string, status: AdminUserStatus) =>
    api.patch(`/api/users/${assertObjectId(id, 'id')}/status`, { status: validateStatus(status) }),
  delete: (id: string) => api.delete(`/api/users/${assertObjectId(id, 'id')}`),
  getStats: () => api.get('/api/users/admin/stats'),
};
