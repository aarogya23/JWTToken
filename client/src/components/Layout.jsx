import { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Store,
  ShoppingBag,
  Package,
  LogOut,
  LogIn,
  UserPlus,
  User,
  Truck,
  Menu,
  X,
  PlusSquare,
} from 'lucide-react';
import FloatingChatWidget from './FloatingChatWidget';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const userNavItems = useMemo(
    () => [
      { to: '/', label: 'Dashboard', icon: Store },
      { to: '/my-products', label: 'My Products', icon: Package },
      { to: '/my-orders', label: 'My Orders', icon: ShoppingBag },
      { to: '/services', label: 'Services', icon: Truck },
      { to: '/profile', label: 'Profile', icon: User },
    ],
    [],
  );

  const mobilePrimaryItems = useMemo(
    () => [
      { to: '/', label: 'Home', icon: Store },
      { to: '/my-products', label: 'Products', icon: Package },
      { to: '/create-product', label: 'Create', icon: PlusSquare },
      { to: '/services', label: 'Services', icon: Truck },
    ],
    [],
  );

  const mobileMenuItems = useMemo(() => {
    const items = [
      { to: '/my-orders', label: 'Orders', icon: ShoppingBag },
      { to: '/profile', label: 'Profile', icon: User },
    ];
    if (user?.deliveryPerson) {
      items.push({ to: '/delivery-jobs', label: 'Deliveries', icon: Truck });
    }
    return items;
  }, [user?.deliveryPerson]);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

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
                {userNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`nav-link ${isActive(item.to) ? 'nav-link-active' : ''}`}
                    >
                      <Icon size={18} /> {item.label}
                    </Link>
                  );
                })}
                {user.deliveryPerson && (
                  <Link
                    to="/delivery-jobs"
                    className={`nav-link ${isActive('/delivery-jobs') ? 'nav-link-active' : ''}`}
                  >
                    <Truck size={18} /> Deliveries
                  </Link>
                )}
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

          {user ? (
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          ) : null}
        </div>
      </header>

      {user && mobileMenuOpen ? (
        <div
          className="mobile-menu-backdrop"
          role="presentation"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="mobile-menu-sheet"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-menu-sheet-head">
              <div>
                <strong>{user.fullName || user.username || 'Member'}</strong>
                <p>{user.email}</p>
              </div>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mobile-menu-links">
              {mobileMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`mobile-menu-link ${isActive(item.to) ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <button
                type="button"
                className="mobile-menu-link mobile-menu-link-button"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <main className="main-content container mt-8 mb-8" style={{ flex: 1 }}>
        <Outlet />
      </main>

      {user && <FloatingChatWidget />}

      {user ? (
        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          {mobilePrimaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`mobile-bottom-link ${isActive(item.to) ? 'active' : ''}`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            className={`mobile-bottom-link mobile-bottom-menu ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <Menu size={19} />
            <span>Menu</span>
          </button>
        </nav>
      ) : null}

      <footer className="footer border-t">
        <div className="container text-center text-muted">
          &copy; {new Date().getFullYear()} C2C Market. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
