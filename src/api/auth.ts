import api from './axios';

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface CompleteProfileData {
  first_name: string;
  last_name: string;
  born_date: string;
  document_type: 'CC' | 'RC' | 'CE';
  document_number: string;
  phone: string;
  requested_role: 'Student' | 'Teacher';
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ProfileStatusResponse {
  profile_complete: boolean;
  person_status: string | null;
}

export const authApi = {
  register: (data: RegisterData) => api.post('/api/auth/register', data),
  login: (data: LoginData) => api.post('/api/auth/login', data),
  completeProfile: (data: CompleteProfileData) => api.post('/api/auth/complete-profile', data),
  profileStatus: () => api.get('/api/auth/profile-status'),
  me: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),
  changePassword: (data: ChangePasswordData) => api.post('/api/auth/change-password', data),
};
