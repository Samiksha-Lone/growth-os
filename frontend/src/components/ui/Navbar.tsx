import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { userName } = useAuth();
  const nameParts = (userName || 'User').trim().split(/\s+/).filter(Boolean);
  const initials = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : (nameParts[0]?.[0] || 'U').toUpperCase();

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
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Hamburger Menu for Mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <h1 className="navbar-title">{getPageTitle(location.pathname)}</h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-6 md:gap-8">
        <div className="hidden md:block text-zinc-400 text-xs font-semibold uppercase tracking-wider">{today}</div>

        <button
          type="button"
          onClick={() => navigate('/settings')}
          aria-label="Open profile settings"
          className="group flex shrink-0 items-center gap-2 sm:gap-3"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-white/10 bg-[#1a1a2e] text-[0.75rem] font-black text-accent transition-all group-hover:border-accent md:h-9 md:w-9">
            {initials}
          </span>
          <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-zinc-200 transition-colors group-hover:text-white sm:text-sm">
            {userName || 'User'}
          </span>
          <svg
            className="text-zinc-500 group-hover:text-white transition-colors"
            width="12" height="12" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
