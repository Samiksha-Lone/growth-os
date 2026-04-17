import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/ToastProvider';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Logo } from '../components/ui/Logo';

export default function LoginPage() {
  const { token, signIn, signUp } = useAuth();
  const { pushToast } = useToast();
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
      pushToast('Passwords must match');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await signUp(name, email, password);
        pushToast('Account created');
      } else {
        await signIn(email, password);
        pushToast('Signed in');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Unable to connect';
      pushToast(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <Card className="login-card">
        <div className="login-brand">
          <div className="brand-mark">
            <Logo />
          </div>
          <div>
            <h1>GrowthOS</h1>
            <p>Daily productivity, habit, and focus system.</p>
          </div>
        </div>

        <div className="auth-switch">
          <button
            type="button"
            className={`switch-pill ${mode === 'login' ? 'active' : ''}`}
            onClick={() => handleModeChange('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`switch-pill ${mode === 'register' ? 'active' : ''}`}
            onClick={() => handleModeChange('register')}
          >
            Register
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label className="field-label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="field-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Full name"
              />
            </>
          )}

          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="field-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="you@company.com"
          />

          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="field-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="••••••••"
          />

          {isRegister && (
            <>
              <label className="field-label" htmlFor="confirm-password">
                Confirm password
              </label>
              <input
                id="confirm-password"
                className="field-input"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                placeholder="••••••••"
              />
            </>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? 'Working…' : isRegister ? 'Create account' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
