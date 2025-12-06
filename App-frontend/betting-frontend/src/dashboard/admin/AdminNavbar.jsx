// src/admin/AdminNavbar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";

const NAV_ITEMS = [
  { label: "Overview", path: "/admin" },
  { label: "Fund Requests", path: "/admin/fund-requests" },
  { label: "Markets & Events", path: "/admin/markets-events" },
  { label: "Tournaments", path: "/admin/tournaments" },
];

export default function AdminNavbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-sky-400 flex items-center justify-center text-xs font-bold text-slate-950 shadow-lg shadow-violet-500/30">
            PZ
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">
              Pryzm Admin
            </div>
            <div className="text-[11px] text-slate-500">
              Internal tools for users, markets & wallets
            </div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2 text-sm">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                [
                  "px-3 py-1.5 rounded-lg transition border",
                  isActive
                    ? "bg-slate-800 border-slate-600 text-slate-50 shadow-sm"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-600",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right section: User info + Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden sm:inline">Logged in as</span>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-100">
              {user?.username || 'Admin'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/40 text-red-300 hover:bg-red-500/20 hover:border-red-500/60 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-slate-800 bg-slate-950">
        <nav className="flex overflow-x-auto text-xs">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                [
                  "flex-1 text-center px-2 py-2 border-r border-slate-800",
                  isActive
                    ? "bg-slate-900 text-slate-50"
                    : "bg-slate-950 text-slate-400",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
