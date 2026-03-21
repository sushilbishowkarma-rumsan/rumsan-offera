// lib/rumsanApi.ts
import axios from 'axios';

// export const rumsanApi = axios.create({
//   baseURL: `${process.env.NEXT_PUBLIC_SERVER_API}/api/v1`,
// });
export const employeeApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_BASE_RUMSAN_URL });
export const departmentApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_BASE_RUMSAN_USER_DEP_URL });

// Attach JWT token to every request
employeeApi.interceptors.request.use((config) => {
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
employeeApi.interceptors.response.use(
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



// Attach JWT token to every request
departmentApi.interceptors.request.use((config) => {
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
departmentApi.interceptors.response.use(
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
