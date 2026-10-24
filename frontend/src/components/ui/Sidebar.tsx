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
    to: '/settings', label: 'Profile', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
    )
  }
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { signOut, githubUrl, linkedinUrl, portfolioUrl } = useAuth();

  return (
    <aside className="bg-[#0c0c0e] border-r border-white/10 p-5 flex flex-col gap-6 sticky top-0 h-dvh min-h-0 w-[280px] overflow-hidden">
      <div className="flex shrink-0 items-center justify-between px-3">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 border border-white/10 flex items-center justify-center rounded-xl bg-[#09090b] shadow-inner overflow-hidden">
            <Logo />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black text-white tracking-tight leading-none">GrowthOS</span>
            <span className="text-[0.65rem] text-zinc-400 font-bold uppercase tracking-widest mt-1">Focus system</span>
          </div>
        </div>

        {/* Close Button for Mobile */}
        <button
          onClick={onClose}
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
          aria-label="Close menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
        <div className="space-y-1">
          {mainLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border ${
                  isActive
                    ? 'bg-[#1c1c22] border-white/10 text-white shadow-md'
                    : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`inline-flex items-center transition-all duration-200 ${isActive ? 'text-accent scale-110' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="mt-auto shrink-0 pt-4 border-t border-white/10">
        <div className="space-y-1">
          {utilityLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border ${
                  isActive
                    ? 'bg-[#1c1c22] border-white/10 text-white shadow-md'
                    : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`inline-flex items-center transition-all duration-200 ${isActive ? 'text-accent scale-110' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={signOut}
            className="w-full group flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border border-transparent text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
          >
            <span className="inline-flex items-center transition-all duration-200 text-zinc-500 group-hover:text-rose-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </span>
            <span>Logout</span>
          </button>
        </div>

        {(githubUrl || linkedinUrl || portfolioUrl) && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-5 justify-center">
            {githubUrl && (
              <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 transition-all duration-200 hover:text-white hover:scale-110" aria-label="GitHub Profile">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7a3.37 3.37 0 0 0-.94 2.58V22"></path></svg>
              </a>
            )}
            {linkedinUrl && (
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 transition-all duration-200 hover:text-white hover:scale-110" aria-label="LinkedIn Profile">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            )}
            {portfolioUrl && (
              <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 transition-all duration-200 hover:text-white hover:scale-110" aria-label="Portfolio">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              </a>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
