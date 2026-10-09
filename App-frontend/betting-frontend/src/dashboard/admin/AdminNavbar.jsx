// src/dashboard/admin/AdminNavbar.jsx
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import ThemeToggle from "../../components/ThemeToggle.jsx";

const NAV_ITEMS = [
  { label: "Overview", path: "/admin" },
  { label: "Users", path: "/admin/create-user" },
  { label: "Fund Requests", path: "/admin/fund-requests" },
  { label: "Markets", path: "/admin/markets-events" },
];

const linkCls = ({ isActive }) =>
  `flex-none whitespace-nowrap px-2 py-[7px] rounded-lg text-[14px] transition-colors ${
    isActive ? "text-tx font-semibold bg-sf2" : "text-mu font-medium hover:text-tx"
  }`;

export default function AdminNavbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-sf border-b border-bd">
      <div className="max-w-page mx-auto px-6 h-[60px] flex items-center gap-4 min-w-0">
        <Link to="/admin" className="flex items-center gap-[9px] flex-none text-tx">
          <img src="/pryzm-icon.svg" alt="Pryzm" className="w-7 h-7 block" />
          <span className="text-[17px] font-[650] tracking-[-0.02em]">Pryzm</span>
          <span className="px-2 py-[3px] rounded-md bg-ams text-amt text-xs font-semibold">Admin</span>
        </Link>

        <nav className="hidden md:flex items-center flex-none ml-2">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === "/admin"} className={linkCls}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 flex-none">
          <Link to="/dashboard" className="hidden sm:flex h-9 px-3 rounded-[9px] text-tx2 hover:text-tx text-[14px] font-medium items-center">
            View site
          </Link>
          <ThemeToggle />
          <span className="hidden sm:flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-[9px] border border-bd text-[13.5px] text-tx2">
            <span className="w-6 h-6 rounded-full bg-prs text-prt flex items-center justify-center text-xs font-[650]">
              {(user?.username || "A").charAt(0).toUpperCase()}
            </span>
            {user?.username || "Admin"}
          </span>
          <button
            onClick={handleLogout}
            className="h-9 px-3.5 rounded-[9px] border border-bd bg-sf text-no text-[14px] font-medium cursor-pointer hover:bg-nos"
          >
            Sign out
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="md:hidden w-9 h-9 rounded-[9px] border border-bd bg-sf text-tx2 flex items-center justify-center cursor-pointer p-0"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-bd">
          <nav className="max-w-page mx-auto px-6 py-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.path === "/admin"} onClick={() => setOpen(false)} className={linkCls}>
                {item.label}
              </NavLink>
            ))}
            <Link to="/dashboard" className="px-2 py-[7px] text-[14px] text-mu font-medium">View site</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
