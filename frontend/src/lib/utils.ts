import { SERVER_URL } from '../api/config';

export const getFullAvatarUrl = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  
  // Clean the path and join with SERVER_URL
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  const baseUrl = SERVER_URL.endsWith('/') ? SERVER_URL : `${SERVER_URL}/`;
  
  return `${baseUrl}${cleanPath}`;
};
