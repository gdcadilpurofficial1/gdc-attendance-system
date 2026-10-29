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
      }, 3500); // 3.5s threshold: only fires when cloud server was asleep (normal requests finish in <500ms)
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

// Silent background keep-alive heartbeat: pings /health every 9 minutes while browser tab is open
// This keeps the cloud server hot and responsive from 8:00 AM to 6:00 PM without sleep
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      api.get('/health').catch(() => {
        // silent suppression for background ping
      });
    }
  }, 9 * 60 * 1000);
}

export default api;