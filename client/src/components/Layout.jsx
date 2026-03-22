import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/commune.css';

export default function Layout() {
  const { isAuthenticated, user, logout, loading, token } = useAuth();
  const navigate = useNavigate();

  if (loading && token) {
    return (
      <div className="commune-body" style={{ padding: '3rem', textAlign: 'center' }}>
        <p className="commune-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="commune-body">
      {isAuthenticated ? (
        <header className="commune-topbar">
          <Link to="/dashboard" className="commune-brand">
            <span className="commune-brand-mark">◇</span>
            commune
          </Link>
          <div className="commune-topbar-space" />
          <label className="commune-search" aria-label="Search">
            <span style={{ opacity: 0.5 }}>🔍</span>
            <input
              type="search"
              placeholder="Search stories & groups…"
              readOnly
              onFocus={() => navigate('/dashboard')}
            />
          </label>
          <div className="commune-topbar-right">
            <button
              type="button"
              className="commune-theme-btn"
              title="Toggle theme"
              aria-label="Toggle theme"
              onClick={() => {
                const el = document.documentElement;
                el.dataset.theme = el.dataset.theme === 'dark' ? 'light' : 'dark';
              }}
            >
              ☾
            </button>
            <button
              type="button"
              className="commune-tb-btn primary"
              onClick={() => navigate('/stories')}
            >
              + Story
            </button>
            <button
              type="button"
              className="commune-tb-btn"
              onClick={() => navigate('/dashboard')}
            >
              Group
            </button>
            <div
              className="commune-tb-btn"
              style={{
                width: 34,
                height: 34,
                padding: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
              title={user?.email}
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700 }}>
                  {(user?.fullName || user?.email || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button type="button" className="commune-tb-btn ghost-red" onClick={logout}>
              Sign out
            </button>
          </div>
        </header>
      ) : (
        <header className="commune-topbar">
          <Link to="/" className="commune-brand">
            <span className="commune-brand-mark">◇</span>
            commune
          </Link>
          <div className="commune-topbar-space" />
          <div className="commune-topbar-right">
            <Link to="/login" className="commune-tb-btn">
              Sign in
            </Link>
            <Link to="/register" className="commune-tb-btn primary">
              Register
            </Link>
          </div>
        </header>
      )}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
