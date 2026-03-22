import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, token } = useAuth();
  const location = useLocation();

  if (loading && token) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.8 }}>
        Loading session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
