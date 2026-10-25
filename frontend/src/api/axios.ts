import axios, { AxiosHeaders } from 'axios';
import { API_BASE_URL } from './config';
import { invalidateAuthSession } from './authSession';

function getRequestToken(headers: unknown): string | null {
  if (!headers || typeof headers !== 'object') return null;
  const value = headers instanceof AxiosHeaders
    ? headers.get('Authorization')
    : (headers as Record<string, unknown>).Authorization
      ?? (headers as Record<string, unknown>).authorization;

  return typeof value === 'string' && value.startsWith('Bearer ')
    ? value.slice('Bearer '.length)
    : null;
}

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
  (response) => {
    const requestToken = getRequestToken(response.config.headers);
    if (requestToken && requestToken !== localStorage.getItem('growthos_token')) {
      return Promise.reject(new axios.CanceledError('Request belongs to a previous authentication session'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const requestToken = getRequestToken(error.config?.headers);
      if (requestToken) invalidateAuthSession(requestToken);
    }
    // Log timeout errors for debugging on deployed site
    if (error.code === 'ECONNABORTED') {
      console.warn('API Request Timeout:', error.config?.url);
    }
    return Promise.reject(error);
  }
);

export default api;
