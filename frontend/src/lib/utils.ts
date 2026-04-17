export const getFullAvatarUrl = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return url;
};
