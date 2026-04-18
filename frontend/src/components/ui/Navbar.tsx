import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getFullAvatarUrl } from '../../lib/utils';

export function Navbar() {
  const location = useLocation();
  const { userName, avatarUrl } = useAuth();
  const [imgSrc, setImgSrc] = useState<string>('');
  const [imgError, setImgError] = useState(false);

  const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'U')}&background=1a1a2e&color=3a86ff&bold=true&size=64`;

  // Recompute src whenever avatarUrl or userName changes
  useEffect(() => {
    const fullUrl = getFullAvatarUrl(avatarUrl);
    if (fullUrl) {
      setImgSrc(fullUrl);
      setImgError(false);
    } else {
      setImgSrc(fallbackSrc);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarUrl, userName]);

  const getPageTitle = (path: string) => {
    const segment = path.split('/')[1];
    if (!segment) return 'Dashboard';
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="navbar">
      <div>
        <h1 className="navbar-title">{getPageTitle(location.pathname)}</h1>
      </div>

      <div className="flex items-center gap-8">
        <div className="text-secondary text-[0.85rem] font-black uppercase tracking-widest">{today}</div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#2a2a2a] transition-all group-hover:border-[#3a86ff] flex-shrink-0 bg-[#1a1a1a]">
            {imgSrc ? (
              <img
                src={imgError ? fallbackSrc : imgSrc}
                alt={userName || 'Profile'}
                className="w-full h-full object-cover"
                onError={() => {
                  setImgError(true);
                  setImgSrc(fallbackSrc);
                }}
              />
            ) : (
              /* Initials fallback while loading */
              <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e] text-[#3a86ff] text-[0.75rem] font-black">
                {(userName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <span className="text-[0.9rem] font-black uppercase tracking-wide group-hover:text-white transition-colors">
            {userName || 'User'}
          </span>
          <svg
            className="text-[#333] group-hover:text-white transition-colors"
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </header>
  );
}
