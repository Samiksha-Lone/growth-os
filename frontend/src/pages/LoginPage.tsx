import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Logo } from '../components/ui/Logo';

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

export default function LoginPage() {
  const { token, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const isRegister = mode === 'register';

  const handleModeChange = (selected: 'login' | 'register') => {
    setMode(selected);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (isRegister) {
      const nameRegex = /^[a-zA-Z\s]+$/;
      if (!nameRegex.test(name)) {
        toast.error('Name must only contain alphabets and spaces');
        return;
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        toast.error('Password must be at least 8 characters long and contain uppercase, lowercase, digits, and special characters');
        return;
      }

      if (password !== confirmPassword) {
        toast.error('Passwords must match');
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegister) {
        await signUp(name, email, password);
        toast.success('Account created');
      } else {
        await signIn(email, password);
        toast.success('Signed in');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Unable to connect';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#050505] px-4 py-8 sm:py-12">
      {/* ── Brand Header (Independent & Stable across tabs) ── */}
      <div className="flex flex-col items-center text-center mb-6 sm:mb-8 select-none">
        <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0c0c0e] border border-white/10 text-white shadow-lg">
          <Logo />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mb-2">
          GrowthOS
        </h1>
        <p className="text-xs text-zinc-400 font-bold uppercase tracking-[2px]">
          Focus System Authentication
        </p>
      </div>

      {/* ── Authentication Card ── */}
      <Card className="w-full max-w-[450px] sm:max-w-[470px] p-6 sm:p-8 md:p-9 primary bg-[#0c0c0e] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl transition-all duration-300">
        {/* Segmented Tab Switcher */}
        <div className="flex gap-1.5 bg-[#070709] p-1.5 rounded-xl border border-white/10 mb-6 sm:mb-7">
          <button
            type="button"
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              mode === 'login'
                ? 'bg-[#1c1c22] text-white shadow-sm border border-white/10'
                : 'bg-transparent text-zinc-400 hover:text-white border border-transparent'
            }`}
            onClick={() => handleModeChange('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              mode === 'register'
                ? 'bg-[#1c1c22] text-white shadow-sm border border-white/10'
                : 'bg-transparent text-zinc-400 hover:text-white border border-transparent'
            }`}
            onClick={() => handleModeChange('register')}
          >
            Register
          </button>
        </div>

        {/* Authentication Form */}
        <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">
                Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => {
                  const filtered = event.target.value.replace(/[^a-zA-Z\s]/g, '');
                  setName(filtered);
                }}
                required
                placeholder="Full name"
                className="field-input !h-12 !px-4 !text-sm sm:!text-base !bg-[#09090b] border border-white/10 focus:border-accent text-white placeholder:text-zinc-500 rounded-xl transition-all"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@company.com"
              className="field-input !h-12 !px-4 !text-sm sm:!text-base !bg-[#09090b] border border-white/10 focus:border-accent text-white placeholder:text-zinc-500 rounded-xl transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="••••••••"
                className="field-input !h-12 !px-4 !pr-11 !text-sm sm:!text-base !bg-[#09090b] border border-white/10 focus:border-accent text-white placeholder:text-zinc-500 rounded-xl transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {isRegister && password && (
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 p-3 bg-[#070709] rounded-xl border border-white/5">
                {[
                  { label: '8+ characters', met: password.length >= 8 },
                  { label: 'Uppercase', met: /[A-Z]/.test(password) },
                  { label: 'Lowercase', met: /[a-z]/.test(password) },
                  { label: 'Number', met: /\d/.test(password) },
                  { label: 'Special char', met: /[@$!%*?&]/.test(password) },
                ].map((req, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${req.met ? 'bg-accent shadow-[0_0_8px_rgba(0,191,255,0.7)]' : 'bg-zinc-700'}`} />
                    <span className={`text-[0.65rem] font-bold uppercase tracking-wider transition-colors duration-200 ${req.met ? 'text-accent' : 'text-zinc-400'}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isRegister && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  placeholder="••••••••"
                  className="field-input !h-12 !px-4 !pr-11 !text-sm sm:!text-base !bg-[#09090b] border border-white/10 focus:border-accent text-white placeholder:text-zinc-500 rounded-xl transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          )}

          <div className="pt-2 sm:pt-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full !h-12 !bg-accent hover:!bg-accent/90 !text-white !font-bold !text-xs sm:!text-sm !rounded-xl active:scale-[0.99] transition-all shadow-lg shadow-accent/25 uppercase tracking-wider cursor-pointer"
            >
              {loading ? 'Working…' : isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
