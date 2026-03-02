import { create } from 'zustand';
import { authApi } from '@/api/auth';

export interface User {
  _id: string;
  email: string;
  role?: string;
  status?: string;
  profile_complete?: boolean;
}

export interface Person {
  _id: string;
  first_name: string;
  last_name: string;
  born_date: string;
  document_type: string;
  document_number: string;
  phone: string;
  profile_photo?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  person: Person | null;
  isLoading: boolean;
  setAuth: (token: string, user: User, person?: Person | null) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  person: JSON.parse(localStorage.getItem('person') || 'null'),
  isLoading: true,

  setAuth: (token, user, person = null) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    if (person) localStorage.setItem('person', JSON.stringify(person));
    set({ token, user, person });
  },

  logout: () => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('person');
    set({ token: null, user: null, person: null });
  },

  fetchMe: async () => {
    try {
      const res = await authApi.me();
      const { user, person } = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      if (person) localStorage.setItem('person', JSON.stringify(person));
      set({ user, person });
    } catch {
      get().logout();
    }
  },

  initialize: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await authApi.me();
        const { user, person } = res.data;
        localStorage.setItem('user', JSON.stringify(user));
        if (person) localStorage.setItem('person', JSON.stringify(person));
        set({ user, person, isLoading: false });
      } catch {
        get().logout();
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
