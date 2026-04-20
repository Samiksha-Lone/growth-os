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
      // Name validation: Only alphabets and spaces
      const nameRegex = /^[a-zA-Z\s]+$/;
      if (!nameRegex.test(name)) {
        toast.error('Name must only contain alphabets and spaces');
        return;
      }

      // Password complexity: min 8 chars, at least one upper, lower, digit, and special char
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
    <div className="min-h-screen grid place-items-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg p-8 primary stack-gap-lg">
        <div className="flex flex-col items-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0a0a0a] border border-border/10 text-white shadow-inner">
            <Logo />
          </div>
          <h1 className="text-[2rem] font-black text-white tracking-tight leading-none mb-1">GrowthOS</h1>
          <p className="text-[0.75rem] text-secondary/60 font-bold uppercase tracking-[2px]">Focus system authentication</p>
        </div>

        <div className="flex gap-2 bg-[#000] p-1.5 rounded-xl border border-border/50">
          <button
            type="button"
            className={`flex-1 py-2.5 rounded-lg text-[0.8rem] font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-[#1a1a1a] text-white shadow-lg' : 'bg-transparent text-secondary hover:text-white'}`}
            onClick={() => handleModeChange('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 rounded-lg text-[0.8rem] font-black uppercase tracking-widest transition-all ${mode === 'register' ? 'bg-[#1a1a1a] text-white shadow-lg' : 'bg-transparent text-secondary hover:text-white'}`}
            onClick={() => handleModeChange('register')}
          >
            Register
          </button>
        </div>

        <form className="stack-gap-md" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="ml-1 label-sub">Name</label>
              <input
                id="name"
                value={name}
                onChange={(event) => {
                  const filtered = event.target.value.replace(/[^a-zA-Z\s]/g, '');
                  setName(filtered);
                }}
                placeholder="Full name"
                className="field-input !h-12 !px-5 !text-[1rem]"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="ml-1 label-sub">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@company.com"
              className="field-input !h-12 !px-5 !text-[1rem]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="ml-1 label-sub">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="••••••••"
                className="field-input !h-12 !px-5 !text-[1rem]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {isRegister && password && (
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 px-1">
                {[
                  { label: '8+ characters', met: password.length >= 8 },
                  { label: 'Uppercase', met: /[A-Z]/.test(password) },
                  { label: 'Lowercase', met: /[a-z]/.test(password) },
                  { label: 'Number', met: /\d/.test(password) },
                  { label: 'Special char', met: /[@$!%*?&]/.test(password) },
                ].map((req, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${req.met ? 'bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]' : 'bg-secondary/20'}`} />
                    <span className={`text-[0.65rem] font-bold uppercase tracking-wider transition-colors duration-300 ${req.met ? 'text-accent' : 'text-secondary/40'}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isRegister && (
            <div className="flex flex-col gap-2">
              <label htmlFor="confirm-password" className="ml-1 label-sub">Confirm password</label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  placeholder="••••••••"
                  className="field-input !h-12 !px-5 !text-[1rem]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-white transition-colors"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full !py-3.5 !bg-accent !text-white !font-black !text-[0.8rem] !rounded-xl active:scale-95 transition-all shadow-xl uppercase tracking-widest"
            >
              {loading ? 'Working…' : isRegister ? 'Create account' : 'Sign in'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
