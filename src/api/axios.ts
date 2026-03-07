import axios from 'axios';
import { toast } from 'sonner';
import { extractApiError, getDetailMessages } from '@/lib/http';
import { clearStoredAccountState, setStoredAccountState } from '@/lib/account-state';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { message } = extractApiError(error);
    const detailMessages = getDetailMessages(error);

    if (error.response?.status === 400) {
      if (detailMessages.length > 0) {
        toast.error(`${message}: ${detailMessages.join(' | ')}`);
      } else {
        toast.error(message);
      }
    }

    if (error.response?.status === 401) {
      clearStoredAccountState();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('person');
      window.location.href = '/login';
    }

    if (error.response?.status === 403) {
      setStoredAccountState({
        status: error.response?.data?.status,
        message,
      });
      toast.error(message || 'Sin permisos para esta operación');
    }

    return Promise.reject(error);
  }
);

export default api;
