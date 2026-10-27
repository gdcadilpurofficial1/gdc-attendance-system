import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 45000, // 45s timeout to gracefully accommodate Render cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer token for cross-domain resilience (e.g. iOS Safari ITP)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gdc_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle session expiration & friendly cold-start notices
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Session expired or token invalidated
      localStorage.removeItem('gdc_auth_user');
      localStorage.removeItem('gdc_auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;