import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import s from './shared.module.css';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) return;
    setToken(token);
    navigate('/dashboard', { replace: true });
  }, [token, setToken, navigate]);

  if (!token) {
    return (
      <div className={s.card}>
        <h1 className={s.title}>OAuth</h1>
        <p className={s.subtitle}>Missing token. Try signing in again.</p>
      </div>
    );
  }

  return (
    <div className={s.card}>
      <h1 className={s.title}>Signing you in…</h1>
      <p className={s.subtitle}>Completing Google sign-in.</p>
    </div>
  );
}
