import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getFullAvatarUrl } from '../../lib/utils';

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
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
      <div className="flex items-center gap-2 md:gap-4">
        {/* Hamburger Menu for Mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <h1 className="navbar-title">{getPageTitle(location.pathname)}</h1>
      </div>

      <div className="flex items-center gap-3 md:gap-8">
        <div className="hidden md:block text-secondary text-[0.8rem] font-bold uppercase tracking-widest opacity-40">{today}</div>

        <div className="flex items-center gap-2 md:gap-3 cursor-pointer group">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden border-2 border-white/5 transition-all group-hover:border-accent flex-shrink-0 bg-[#1a1a1a]">
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
              <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e] text-accent text-[0.75rem] font-black">
                {(userName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <span className="max-w-[80px] sm:max-w-[150px] truncate text-[0.85rem] font-black uppercase tracking-wide group-hover:text-white transition-colors">
            {userName || 'User'}
          </span>
          <svg
            className="text-white/20 group-hover:text-white transition-colors"
            width="12" height="12" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="4"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </header>
  );
}
