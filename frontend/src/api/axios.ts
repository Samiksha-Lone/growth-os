import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 second timeout for all requests
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('growthos_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add cache buster to GET requests
  if (config.method === 'get') {
    config.params = {
      ...config.params,
      _t: Date.now()
    };
    config.headers = config.headers ?? {};
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('growthos_token');
    }
    // Log timeout errors for debugging on deployed site
    if (error.code === 'ECONNABORTED') {
      console.warn('API Request Timeout:', error.config?.url);
    }
    return Promise.reject(error);
  }
);

export default api;
