import axios from 'axios';

const inferredBaseUrl = (() => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (import.meta.env.DEV) return '/api';
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') return 'http://localhost:5000/api';
  return '/api';
})();

const api = axios.create({
  baseURL: inferredBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('growthos_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('growthos_token');
    }
    return Promise.reject(error);
  }
);

export default api;
