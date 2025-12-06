import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

function NavItem({ to, label, pathname, icon }) {
  const isActive = pathname === to || (to !== '/' && pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-300 group ${
        isActive
          ? 'text-slate-900 bg-gradient-to-r from-amber-400 to-amber-500 shadow-lg shadow-amber-500/30'
          : 'text-slate-300 hover:text-amber-400 hover:bg-slate-800/50'
      }`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        {label}
      </span>
      {isActive && (
        <motion.div
          layoutId="navbar-active"
          className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl"
          initial={false}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
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

  // Extract roles from user object
  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ADMIN');

  // Hide navbar on auth pages and admin pages
  if (pathname === '/login' || pathname === '/signup') return null;
  if (pathname.startsWith('/admin')) return null;

  const onLogout = async () => {
    await logout();
    nav('/login');
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50 shadow-lg"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand + Primary Nav */}
          <div className="flex items-center gap-8">
            {/* Brand */}
            <Link
              to={user ? '/dashboard' : '/login'}
              className="flex items-center gap-3 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                  Pryzm
                </div>
                <div className="text-xs text-slate-500 -mt-1">Prediction Markets</div>
              </div>
            </Link>

            {/* Navigation Links */}
            {user && (
              <div className="hidden md:flex items-center gap-2">
                <NavItem to="/dashboard" label="Dashboard" pathname={pathname} icon="📊" />
                <NavItem to="/markets" label="Markets" pathname={pathname} icon="📈" />
                <NavItem to="/news" label="News" pathname={pathname} icon="📰" />
                <NavItem to="/tournaments" label="Tournaments" pathname={pathname} icon="🏆" />
                {isAdmin && (
                  <NavItem to="/admin" label="Admin" pathname={pathname} icon="🛡️" />
                )}
              </div>
            )}
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {/* User Info */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/50 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-sm shadow-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-semibold text-slate-200">{user.username}</div>
                      <div className="text-xs text-slate-500">View Profile</div>
                    </div>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 py-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl"
                      >
                        <Link
                          to="/settings"
                          className="block px-4 py-2 text-sm text-slate-300 hover:text-amber-400 hover:bg-slate-700/50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          ⚙️ Settings
                        </Link>
                        <Link
                          to="/wallet"
                          className="block px-4 py-2 text-sm text-slate-300 hover:text-amber-400 hover:bg-slate-700/50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          💰 Wallet
                        </Link>
                        <div className="my-1 border-t border-slate-700" />
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onLogout();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-slate-700/50 transition-colors"
                        >
                          🚪 Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-300 hover:text-amber-400 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-semibold shadow-lg shadow-amber-500/30 transition-all"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </motion.header>
  );
}
