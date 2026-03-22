import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { googleAuthUrl } from '../config';
import s from './shared.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={s.card}>
      <h1 className={s.title}>Sign in</h1>
      <p className={s.subtitle}>Use your account or continue with Google.</p>

      {error ? <div className={s.error}>{error}</div> : null}

      <form onSubmit={handleSubmit}>
        <div className={s.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={s.field}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className={s.row}>
          <button type="submit" className={s.btn} disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>

      <p className={s.muted} style={{ marginTop: '1.25rem' }}>
        Or{' '}
        <a href={googleAuthUrl} className={s.muted} style={{ color: '#7eb8ff' }}>
          continue with Google
        </a>{' '}
        (opens your Spring Boot OAuth flow).
      </p>

      <p className={s.muted} style={{ marginTop: '1rem' }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
