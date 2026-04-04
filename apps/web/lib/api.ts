// lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_SERVER_API}`,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  // Must check typeof window — this code runs on client only
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Auto-logout on 401 ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
        const isUserLookup = /\/users\/[^/]+$/.test(url);

    if (status === 401 && !isUserLookup) {
      if (typeof window !== 'undefined') {
        // Clear all auth data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');

        // Only redirect if we aren't already on the login/register page
        const isAuthPage = window.location.pathname === '/login';

        if (!isAuthPage) {
          console.warn('[api] Session invalid. Logging out...');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);
