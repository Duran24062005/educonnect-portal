const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/';

export const getMediaUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  try {
    const origin = new URL(API_URL).origin;
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  } catch {
    return path;
  }
};
