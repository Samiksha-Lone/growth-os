export const SERVER_URL = (() => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace('/api', '');
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  return ''; // Relative to frontend root
})();

export const API_BASE_URL = `${SERVER_URL}/api`;
