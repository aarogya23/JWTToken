import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, ShoppingBag, Package, LogOut, LogIn, UserPlus, User, Truck } from 'lucide-react';
import FloatingChatWidget from './FloatingChatWidget';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-container min-h-screen flex flex-col">
      <header className="navbar shadow">
        <div className="container navbar-container">
          <Link to="/" className="navbar-brand flex items-center gap-2 font-bold text-lg">
            <Store className="brand-icon" />
            <span>C2C Market</span>
          </Link>
          
          <nav className="navbar-nav">
            {user ? (
              <>
                <Link to="/" className="nav-link">
                  <Store size={18} /> Dashboard
                </Link>
                <Link to="/my-products" className="nav-link">
                  <Package size={18} /> My Products
                </Link>
                <Link to="/my-orders" className="nav-link">
                  <ShoppingBag size={18} /> My Orders
                </Link>
                {user.deliveryPerson && (
                  <Link to="/delivery-jobs" className="nav-link" style={{ color: '#4f46e5', fontWeight: 'bold' }}>
                    <Truck size={18} /> Deliveries
                  </Link>
                )}
{/* Chat Groups moved to Floating Widget */}
                <Link to="/profile" className="nav-link">
                  <User size={18} /> Profile
                </Link>
                <button onClick={handleLogout} className="btn btn-outline nav-btn">
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline nav-btn">
                  <LogIn size={18} /> Login
                </Link>
                <Link to="/register" className="btn btn-primary nav-btn">
                  <UserPlus size={18} /> Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main-content container mt-8 mb-8" style={{ flex: 1 }}>
        <Outlet />
      </main>

      {user && <FloatingChatWidget />}

      <footer className="footer border-t">
        <div className="container text-center text-muted">
          &copy; {new Date().getFullYear()} C2C Market. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
