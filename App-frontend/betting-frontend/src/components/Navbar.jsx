import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { AnimatePresence, motion } from 'framer-motion';

function NavItem({ to, label, pathname }) {
  const isActive = pathname === to || (to !== '/' && pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`relative px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
        isActive
          ? 'text-white'
          : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {label}
      {isActive && (
        <motion.span
          layoutId="navbar-active"
          className="absolute bottom-0 left-0 right-0 h-px bg-white"
          initial={false}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ADMIN');

  if (pathname === '/login' || pathname === '/signup') return null;
  if (pathname.startsWith('/admin')) return null;

  const onLogout = async () => {
    await logout();
    nav('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d0a18]/80 border-b border-white/[0.06] backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Left: Brand + Nav */}
          <div className="flex items-center gap-8">
            {/* Brand */}
            <Link
              to={user ? '/dashboard' : '/login'}
              className="flex items-center gap-2.5"
            >
              <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-700/60 ring-1 ring-violet-400/30">
                <svg className="w-4 h-4 drop-shadow-[0_0_4px_rgba(251,191,36,0.9)]" viewBox="0 0 24 24" fill="url(#navBolt)" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="navBolt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fde68a"/>
                      <stop offset="100%" stopColor="#f59e0b"/>
                    </linearGradient>
                  </defs>
                  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                <div className="absolute inset-0 rounded-lg bg-violet-400/20 blur-sm -z-10" />
              </div>
              <span className="text-sm font-semibold bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent tracking-tight">Pryzm</span>
            </Link>

            {/* Navigation Links */}
            {user && (
              <div className="hidden md:flex items-center gap-1">
                <NavItem to="/dashboard" label="Dashboard" pathname={pathname} />
                <NavItem to="/markets" label="Markets" pathname={pathname} />
                <NavItem to="/portfolio" label="Portfolio" pathname={pathname} />
                <NavItem to="/news" label="News" pathname={pathname} />
                <NavItem to="/tournaments" label="Tournaments" pathname={pathname} />
                {isAdmin && (
                  <NavItem to="/admin" label="Admin" pathname={pathname} />
                )}
              </div>
            )}
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors"
                >
                  <div className="w-6 h-6 rounded-sm bg-white/10 border border-white/[0.08] flex items-center justify-center text-xs font-semibold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm text-slate-300">{user.username}</span>
                  <svg
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-1.5 w-44 py-1 bg-[#131820] border border-white/[0.08] rounded-lg shadow-xl"
                    >
                      <Link
                        to="/settings"
                        className="block px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Settings
                      </Link>
                      <Link
                        to="/wallet"
                        className="block px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Wallet
                      </Link>
                      <div className="my-1 border-t border-white/[0.06]" />
                      <button
                        onClick={() => { setShowUserMenu(false); onLogout(); }}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                      >
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1.5 rounded-md bg-white text-[#0b0e14] text-sm font-medium hover:bg-slate-100 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
