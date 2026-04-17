import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Logo } from '../components/ui/Logo';

export default function LoginPage() {
  const { token, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl border border-border grid place-items-center bg-background">
              <Logo />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-primary tracking-tight">GrowthOS</h1>
              <p className="text-secondary mt-2">Daily productivity, habit, and focus system.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-[#111111] border border-border rounded-2xl p-1 mb-8">
          <button
            type="button"
            className={`rounded-2xl py-3 text-sm font-semibold transition ${mode === 'login' ? 'bg-accent text-background' : 'text-secondary hover:text-primary'}`}
            onClick={() => handleModeChange('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`rounded-2xl py-3 text-sm font-semibold transition ${mode === 'register' ? 'bg-accent text-background' : 'text-secondary hover:text-primary'}`}
            onClick={() => handleModeChange('register')}
          >
            Register
          </button>
        </div>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium text-secondary">Name</label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Full name"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-primary placeholder:text-secondary transition-all duration-200 focus:border-accent focus:outline-none"
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
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-primary placeholder:text-secondary transition-all duration-200 focus:border-accent focus:outline-none"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="password" className="text-sm font-medium text-secondary">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-primary placeholder:text-secondary transition-all duration-200 focus:border-accent focus:outline-none"
            />
          </div>

          {isRegister && (
            <div className="grid gap-2">
              <label htmlFor="confirm-password" className="text-sm font-medium text-secondary">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-primary placeholder:text-secondary transition-all duration-200 focus:border-accent focus:outline-none"
              />
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full text-center">
            {loading ? 'Working…' : isRegister ? 'Create account' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
