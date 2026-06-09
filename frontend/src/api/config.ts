export const SERVER_URL = (() => {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE;
  if (envBaseUrl) {
    const normalized = envBaseUrl.replace(/\/+$/, '');
    const baseUrl = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
    return baseUrl;
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000/api';
  }
  return '/api';
})();

export const API_BASE_URL = SERVER_URL;
