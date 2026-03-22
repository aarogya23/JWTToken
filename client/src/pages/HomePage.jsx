import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
export default function HomePage() {
  const { isAuthenticated, loading, token } = useAuth();

  if (loading && token) {
    return (
      <div className="commune-page-single">
        <p className="commune-muted">Loading…</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="commune-page-single">
      <h1
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: '2rem',
          marginBottom: '0.5rem',
        }}
      >
        Commune — peer marketplace
      </h1>
      <p className="commune-muted" style={{ marginBottom: '1.5rem', maxWidth: 520 }}>
        A C2C space where members share products and services, build groups, post
        stories, and chat. Sign in with email or Google; your JWT is issued by the
        Spring Boot API.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/login" className="commune-tb-btn">
          Sign in
        </Link>
        <Link to="/register" className="commune-tb-btn primary">
          Register
        </Link>
      </div>
    </div>
  );
}
