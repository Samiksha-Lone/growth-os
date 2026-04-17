import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getFullAvatarUrl } from '../../lib/utils';

export function Navbar() {
  const location = useLocation();
    const { userName, avatarUrl } = useAuth();
  
  const getPageTitle = (path: string) => {
    const segment = path.split('/')[1];
    if (!segment) return 'Dashboard';
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');
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
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ color: '#7d7d7d', fontSize: '0.9rem' }}>{today}</div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333', overflow: 'hidden', border: '1px solid #444' }}>
             <img 
               src={getFullAvatarUrl(avatarUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=333&color=fff`} 
               alt="Profile" 
               style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
             />
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{userName || 'Samiksha'}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
    </header>
  );
}
