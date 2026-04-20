import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';
import { useAuth } from '../../hooks/useAuth';

const mainLinks = [
  {
    to: '/dashboard', label: 'Dashboard', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    )
  },
  {
    to: '/planner', label: 'Planner', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
    )
  },
  {
    to: '/reflection', label: 'Reflection', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
    )
  },
  {
    to: '/habits', label: 'Habits', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l5.64 5.64A9 9 0 0 0 20.49 15" /></svg>
    )
  },
  {
    to: '/insights', label: 'Insights', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
    )
  },
  {
    to: '/analytics', label: 'Analytics', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
    )
  },
  {
    to: '/pomodoro', label: 'Pomodoro', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    )
  },
  {
    to: '/history', label: 'History', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
    )
  }
];

const utilityLinks = [
  {
    to: '/reality-check', label: 'Reality Check', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
    )
  },
  {
    to: '/settings', label: 'Settings', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
    )
  }
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { signOut, userEmail, githubUrl, linkedinUrl, portfolioUrl } = useAuth();

  return (
    <aside className="bg-card border-r border-border p-5 flex flex-col gap-8 sticky top-0 h-screen w-[280px] overflow-hidden">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-border flex items-center justify-center rounded-xl bg-[#0a0a0a] shadow-inner overflow-hidden">
            <Logo />
          </div>
          <div className="flex flex-col">
            <span className="text-[1.1rem] font-black text-white tracking-tight leading-none">GrowthOS</span>
            <span className="text-[0.7rem] text-secondary font-black uppercase tracking-widest mt-1">Focus system</span>
          </div>
        </div>

        {/* Close Button for Mobile */}
        <button
          onClick={onClose}
          className="md:hidden p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors text-secondary hover:text-white"
          aria-label="Close menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-6">
        <div className="space-y-1">
          {mainLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[0.9rem] font-bold transition-all duration-300 border ${isActive ? 'bg-[#1a1a1a] border-border text-white shadow-lg' : 'border-transparent text-secondary hover:text-white hover:bg-[#111]'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`inline-flex items-center transition-all duration-300 ${isActive ? 'text-accent scale-110' : 'text-secondary/50 group-hover:text-secondary'}`}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="space-y-1 pt-6 border-t border-border">
          {utilityLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[0.9rem] font-bold transition-all duration-300 border ${isActive ? 'bg-[#1a1a1a] border-border text-white shadow-lg' : 'border-transparent text-secondary hover:text-white hover:bg-[#111]'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`inline-flex items-center transition-all duration-300 ${isActive ? 'text-accent scale-110' : 'text-secondary/50 group-hover:text-secondary'}`}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={signOut}
            className="w-full group flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[0.9rem] font-bold transition-all duration-300 border border-transparent text-secondary hover:text-red-500 hover:bg-red-500/05 cursor-pointer"
          >
            <span className="inline-flex items-center transition-all duration-300 text-secondary/50 group-hover:text-red-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </span>
            <span>Logout</span>
          </button>
        </div>

        {(githubUrl || linkedinUrl || portfolioUrl) && (
          <div className="mt-auto pt-6 border-t border-border flex items-center gap-5 justify-center">
            {githubUrl && (
              <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-secondary/60 transition-all duration-300 hover:text-white hover:scale-110">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7a3.37 3.37 0 0 0-.94 2.58V22"></path></svg>
              </a>
            )}
            {linkedinUrl && (
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-secondary/60 transition-all duration-300 hover:text-white hover:scale-110">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            )}
            {portfolioUrl && (
              <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-secondary/60 transition-all duration-300 hover:text-white hover:scale-110">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              </a>
            )}
          </div>
        )}
      </nav>
    </aside>
  );
}
