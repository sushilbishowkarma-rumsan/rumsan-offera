// lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_SERVER_API}/api/v1`,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  // Must check typeof window — this code runs on client only
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('[api] No auth_token found in localStorage for:', config.url);
    }
  }
  return config;
});

// ── Auto-logout on 401 ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Clear all auth data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');

        // Redirect to login page
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
