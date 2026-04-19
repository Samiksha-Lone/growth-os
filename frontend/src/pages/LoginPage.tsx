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
    if (isRegister && password !== confirmPassword) {
      toast.error('Passwords must match');
      return;
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
      <Card className="w-full max-w-lg p-0">
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.8)]">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-primary">
              <Logo />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">GrowthOS</h1>
            <p className="mt-1 text-xs text-secondary">A refined sign in experience aligned with the dashboard UI.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-3xl bg-slate-950/80 p-1 mb-6">
            <button
              type="button"
              className={`rounded-3xl py-2.5 text-sm font-semibold transition ${mode === 'login' ? 'bg-background text-primary shadow-sm shadow-slate-950/20' : 'text-secondary hover:text-primary'}`}
              onClick={() => handleModeChange('login')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`rounded-3xl py-2.5 text-sm font-semibold transition ${mode === 'register' ? 'bg-background text-primary shadow-sm shadow-slate-950/20' : 'text-secondary hover:text-primary'}`}
              onClick={() => handleModeChange('register')}
            >
              Register
            </button>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium text-secondary">Name</label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Full name"
                  className="field-input w-full rounded-3xl bg-background border border-border px-4 py-3 text-primary placeholder:text-secondary focus:border-accent focus:outline-none"
                />
              </div>
            )}

            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium text-secondary">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@company.com"
                className="field-input w-full rounded-3xl bg-background border border-border px-4 py-3 text-primary placeholder:text-secondary focus:border-accent focus:outline-none"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium text-secondary">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="••••••••"
                  className="field-input w-full rounded-3xl bg-background border border-border px-4 py-3 pr-12 text-primary placeholder:text-secondary focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className="grid gap-2">
                <label htmlFor="confirm-password" className="text-sm font-medium text-secondary">Confirm password</label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    placeholder="••••••••"
                    className="field-input w-full rounded-3xl bg-background border border-border px-4 py-3 pr-12 text-primary placeholder:text-secondary focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full rounded-3xl py-3 text-base font-semibold">
              {loading ? 'Working…' : isRegister ? 'Create account' : 'Sign in'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
