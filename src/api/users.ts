import api from './axios';

const toApiRole = (role?: string) => (role ? role.toLowerCase() : role);

export type AdminUserRole = 'student' | 'teacher' | 'admin' | 'guardian';
export type AdminUserStatus = 'active' | 'pending' | 'inactive' | 'blocked' | 'egresado';

export const usersApi = {
  list: (params?: { role?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const normalizedParams = params
      ? {
          ...params,
          role: params.role && params.role !== 'all' ? toApiRole(params.role) : params.role,
        }
      : params;
    return api.get('/api/users', { params: normalizedParams });
  },
  listByRole: (role: string, params?: { page?: number; limit?: number }) =>
    api.get(`/api/users/role/${role.toLowerCase()}`, { params }),
  get: (id: string) => api.get(`/api/users/${id}`),
  update: (id: string, data: any) => api.put(`/api/users/${id}`, data),
  uploadPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('profile_photo', file);
    return api.patch(`/api/users/${id}/profile-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getPending: () => api.get('/api/users/admin/pending'),
  approve: (id: string, role: AdminUserRole) => api.post(`/api/users/${id}/approve`, { role: toApiRole(role) }),
  changeStatus: (id: string, status: AdminUserStatus) => api.patch(`/api/users/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/api/users/${id}`),
  getStats: () => api.get('/api/users/admin/stats'),
};
