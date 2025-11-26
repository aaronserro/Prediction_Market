import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
const headerStyle = {
  position: 'fixed',
  top: 0,
  width: '100%',
  background: '#111',
  borderBottom: '1px solid #FFD700',
  zIndex: 100,
};

const navStyle = {
  maxWidth: '1100px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '12px 16px',
};

const brandStyle = {
  color: '#FFD700',
  fontWeight: 800,
  textDecoration: 'none',
  fontSize: 18,
  letterSpacing: 0.4,
};

const btnStyle = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid #FFD700',
  background: '#FFD700',
  color: '#000',
  fontWeight: 700,
  cursor: 'pointer',
};

const linkBase = {
  textDecoration: 'none',
  padding: '8px 10px',
  borderRadius: 10,
  transition: 'background .2s ease, color .2s ease',
};

const linkInactive = {
  ...linkBase,
  color: '#FFD700',
};

const linkActive = {
  ...linkBase,
  color: '#000',
  background: '#FFD700',
};

function NavItem({ to, label, pathname }) {
  const isActive = pathname === to || (to !== '/' && pathname.startsWith(to));
  return (
    <Link
      to={to}
      style={isActive ? linkActive : linkInactive}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();

  // Extract roles from user object
  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ADMIN');

  // Debug logging
  console.log('[Navbar] user:', user);
  console.log('[Navbar] roles:', roles);
  console.log('[Navbar] isAdmin:', isAdmin);

  // Hide navbar on auth pages
  if (pathname === '/login' || pathname === '/signup') return null;

  const onLogout = async () => {
    await logout();
    nav('/login');
  };

  return (
    <header style={headerStyle}>
      <nav style={navStyle}>
        {/* Left: Brand + Primary Nav (when logged in) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to={user ? '/dashboard' : '/login'} style={brandStyle}>
            Betting App
          </Link>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <NavItem to="/dashboard" label="Dashboard" pathname={pathname} />
              <NavItem to="/games" label="Games" pathname={pathname} />
              <NavItem to="/partys" label="Partys" pathname={pathname} />
              <NavItem to="/settings" label="User Settings" pathname={pathname} />

              {/* ✅ Admin-only link */}
              {isAdmin && (
                <NavItem to="/admin" label="Admin Dashboard" pathname={pathname} />
              )}
            </div>
          )}
        </div>

        {/* Right: Auth controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <span style={{ color: '#ddd', fontSize: 14 }}>
                Hi, {user.username}
              </span>
              <button onClick={onLogout} style={btnStyle}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ ...linkInactive, marginLeft: 0 }}>
                Login
              </Link>
              <Link to="/signup" style={btnStyle}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
