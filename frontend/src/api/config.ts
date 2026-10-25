export const SERVER_URL = (() => {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE;
  if (envBaseUrl) {
    if (!import.meta.env.DEV) {
      let backendUrl: URL;
      try {
        backendUrl = new URL(envBaseUrl);
      } catch {
        throw new Error('VITE_API_BASE_URL must be an absolute URL for the separately deployed GrowthOS backend.');
      }
      if (backendUrl.protocol !== 'https:' && backendUrl.protocol !== 'http:') {
        throw new Error('VITE_API_BASE_URL must use HTTP or HTTPS.');
      }
    }

    const normalized = envBaseUrl.replace(/\/+$/, '');
    const baseUrl = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
    return baseUrl;
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }
  throw new Error('VITE_API_BASE_URL must be set to the separately deployed GrowthOS backend URL.');
})();

export const API_BASE_URL = SERVER_URL;
