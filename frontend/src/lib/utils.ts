import { SERVER_URL } from '../api/config';

export const getFullAvatarUrl = (url: string | null) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  const apiBase = new URL(SERVER_URL, window.location.origin);
  const apiPath = apiBase.pathname.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  const assetPath = url.startsWith('/') ? url : `/${url}`;
  return new URL(`${apiPath}${assetPath}`, apiBase.origin).toString();
};
