import api from './axios';

export const usersApi = {
  list: (params?: { role?: string; status?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/api/users', { params }),
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
  approve: (id: string, role: string) => api.post(`/api/users/${id}/approve`, { role }),
  changeStatus: (id: string, status: string) => api.patch(`/api/users/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/api/users/${id}`),
  getStats: () => api.get('/api/users/admin/stats'),
};
