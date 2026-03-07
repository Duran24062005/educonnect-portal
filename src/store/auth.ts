import { create } from 'zustand';
import { authApi } from '@/api/auth';
import { normalizeRole, normalizeStatus } from '@/lib/auth';

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
  profile_photo_url?: string;
  role?: string;
  status?: string;
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

const parseStoredJson = <T>(key: string): T | null => {
  const raw = localStorage.getItem(key);
  if (!raw || raw === 'undefined' || raw === 'null') return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const normalizeUser = (
  user: Partial<User> | null | undefined,
  person?: Partial<Person> | null,
  profileComplete?: boolean
): User | null => {
  if (!user) return null;

  return {
    ...(user as User),
    role: normalizeRole(user.role ?? person?.role),
    status: normalizeStatus(user.status ?? person?.status),
    profile_complete: user.profile_complete ?? profileComplete ?? Boolean(person),
  };
};

const initialPerson = parseStoredJson<Person>('person');
const initialUser = normalizeUser(parseStoredJson<User>('user'), initialPerson);

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: initialUser,
  person: initialPerson,
  isLoading: true,

  setAuth: (token, user, person = null) => {
    const normalizedUser = normalizeUser(user, person);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    if (person) {
      localStorage.setItem('person', JSON.stringify(person));
    } else {
      localStorage.removeItem('person');
    }
    set({ token, user: normalizedUser, person });
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
      const payload = res.data?.data ?? res.data;
      const user = payload?.user;
      const person = payload?.person ?? null;
      const profileComplete = payload?.profile_complete;

      if (!user) throw new Error('Invalid /me payload: missing user');

      const normalizedUser = normalizeUser(user, person, profileComplete);
      if (!normalizedUser) throw new Error('Invalid normalized user');

      localStorage.setItem('user', JSON.stringify(normalizedUser));
      if (person) localStorage.setItem('person', JSON.stringify(person));
      else localStorage.removeItem('person');
      set({ user: normalizedUser, person });
    } catch {
      get().logout();
    }
  },

  initialize: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await authApi.me();
        const payload = res.data?.data ?? res.data;
        const user = payload?.user;
        const person = payload?.person ?? null;
        const profileComplete = payload?.profile_complete;

        if (!user) throw new Error('Invalid /me payload: missing user');

        const normalizedUser = normalizeUser(user, person, profileComplete);
        if (!normalizedUser) throw new Error('Invalid normalized user');

        localStorage.setItem('user', JSON.stringify(normalizedUser));
        if (person) localStorage.setItem('person', JSON.stringify(person));
        else localStorage.removeItem('person');
        set({ user: normalizedUser, person, isLoading: false });
      } catch {
        get().logout();
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
