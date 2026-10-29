import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 55000, // 55s timeout to gracefully accommodate Render cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

let activePendingRequests = 0;
let coldStartTimer: ReturnType<typeof setTimeout> | null = null;
let isWarmingUp = false;

// Request Interceptor: Attach JWT Bearer token & start cold-start monitor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gdc_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    activePendingRequests++;
    if (activePendingRequests === 1) {
      coldStartTimer = setTimeout(() => {
        isWarmingUp = true;
        window.dispatchEvent(new CustomEvent('gdc-cloud-warming-up'));
      }, 2500);
    }

    return config;
  },
  (error) => {
    activePendingRequests = Math.max(0, activePendingRequests - 1);
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle session expiration & clear cold-start notice
api.interceptors.response.use(
  (response) => {
    activePendingRequests = Math.max(0, activePendingRequests - 1);
    if (activePendingRequests === 0) {
      if (coldStartTimer) clearTimeout(coldStartTimer);
      if (isWarmingUp) {
        isWarmingUp = false;
        window.dispatchEvent(new CustomEvent('gdc-cloud-online'));
      }
    }
    return response;
  },
  (error) => {
    activePendingRequests = Math.max(0, activePendingRequests - 1);
    if (activePendingRequests === 0) {
      if (coldStartTimer) clearTimeout(coldStartTimer);
      if (isWarmingUp) {
        isWarmingUp = false;
        window.dispatchEvent(new CustomEvent('gdc-cloud-online'));
      }
    }

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