import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { useWallet } from "../lib/wallet.jsx";
import { fmt } from "../lib/format.js";
import { Coin } from "./ui.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/markets", label: "Markets" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/news", label: "News" },
  { to: "/tournaments", label: "Tournaments" },
  { to: "/blog", label: "Blog" },
];

// What signed-out visitors can open without an account.
const GUEST_LINKS = [
  { to: "/markets", label: "Markets" },
  { to: "/blog", label: "Blog" },
];

const isActive = (pathname, to) => pathname === to || pathname.startsWith(to + "/");

function SearchBox() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const [q, setQ] = useState("");

  // Mirror the Markets page query so the box reflects the current search.
  useEffect(() => {
    setQ(pathname === "/markets" ? params.get("q") || "" : "");
  }, [pathname, params]);

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    nav(term ? `/markets?q=${encodeURIComponent(term)}` : "/markets");
  };

  return (
    <form
      onSubmit={submit}
      className="flex-[1_1_0] max-w-[420px] min-w-[38px] h-[38px] overflow-hidden flex flex-wrap content-start gap-x-2.5 px-3 rounded-[10px] bg-sf2 border border-bd text-mu text-[14px]"
    >
      <button type="submit" aria-label="Search markets" className="h-9 flex items-center flex-none bg-transparent border-0 p-0 text-mu cursor-pointer">
        <span className="block w-[11px] h-[11px] rounded-full border-[1.6px] border-current" />
      </button>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search markets"
        className="h-9 flex-[1_0_100px] min-w-0 bg-transparent border-0 outline-none text-tx placeholder:text-mu"
      />
    </form>
  );
}

function UserMenu({ user, isAdmin, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const item = "block w-full text-left px-3 py-2 text-[14px] text-tx2 hover:bg-sf2 hover:text-tx";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        className="flex items-center gap-1.5 pl-1.5 pr-1 h-9 bg-transparent border-0 cursor-pointer"
      >
        <span className="w-[30px] h-[30px] rounded-full bg-prs text-prt flex items-center justify-center text-[13px] font-[650]">
          {user.username.charAt(0).toUpperCase()}
        </span>
        <span className="hidden sm:block w-1.5 h-1.5 border-r-[1.5px] border-b-[1.5px] border-mu rotate-45 -translate-y-0.5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-48 py-1 bg-sf border border-bd rounded-xl shadow-lift z-50">
          <div className="px-3 py-2 text-[13px] text-mu truncate">{user.username}</div>
          <div className="border-t border-bd my-1" />
          <Link to="/wallet" className={item} onClick={() => setOpen(false)}>Wallet</Link>
          <Link to="/settings" className={item} onClick={() => setOpen(false)}>Settings</Link>
          {isAdmin && <Link to="/admin" className={item} onClick={() => setOpen(false)}>Admin</Link>}
          <div className="border-t border-bd my-1" />
          <button onClick={() => { setOpen(false); onLogout(); }} className={`${item} bg-transparent border-0 cursor-pointer text-no hover:text-no`}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { balance } = useWallet();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("ROLE_ADMIN") || roles.includes("ADMIN");

  if (pathname === "/login" || pathname === "/signup") return null;
  if (pathname.startsWith("/admin")) return null;

  const onLogout = async () => {
    await logout();
    nav("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-sf border-b border-bd">
      <div className="max-w-page mx-auto px-6 h-[60px] flex items-center gap-4 min-w-0">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-[9px] flex-none text-tx">
          <img src="/pryzm-icon.svg" alt="Pryzm" className="w-7 h-7 block" />
          <span className="text-[17px] font-[650] tracking-[-0.02em]">Pryzm</span>
        </Link>

        <SearchBox />

        {(
          <nav className={`${user ? "hidden lg:flex" : "hidden sm:flex"} items-center flex-none`}>
            {(user ? LINKS : GUEST_LINKS).map(({ to, label }) => {
              const on = isActive(pathname, to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex-none whitespace-nowrap px-2 py-[7px] rounded-lg text-[14px] transition-colors ${
                    on ? "text-tx font-semibold bg-sf2" : "text-mu font-medium hover:text-tx"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2 flex-none">
          <ThemeToggle />
          {user ? (
            <>
              <Link
                to="/wallet"
                className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-[9px] border border-bd text-tx hover:bg-sf2"
              >
                <Coin />
                <span className="font-mono text-[14px] font-semibold tracking-[-0.02em]">{balance === null ? "—" : fmt(balance)}</span>
              </Link>
              <Link
                to="/wallet"
                className="hidden md:flex h-9 px-3.5 rounded-[9px] bg-pr hover:bg-prh text-white text-[14px] font-semibold items-center"
              >
                Add funds
              </Link>
              <UserMenu user={user} isAdmin={isAdmin} onLogout={onLogout} />
              <button
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
                className="lg:hidden w-9 h-9 rounded-[9px] border border-bd bg-sf text-tx2 flex items-center justify-center cursor-pointer p-0"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="h-9 px-3.5 rounded-[9px] text-tx2 hover:text-tx text-[14px] font-medium flex items-center">
                Log in
              </Link>
              <Link to="/signup" className="h-9 px-4 rounded-[9px] bg-pr hover:bg-prh text-white text-[14px] font-semibold flex items-center">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {mobileOpen && user && (
        <div className="lg:hidden border-t border-bd bg-sf">
          <div className="max-w-page mx-auto px-6 py-3 flex flex-col gap-1">
            {LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-2.5 rounded-lg text-[14px] ${
                  isActive(pathname, to) ? "bg-sf2 text-tx font-semibold" : "text-tx2 font-medium hover:bg-sf2"
                }`}
              >
                {label}
              </Link>
            ))}
            <Link to="/wallet" className="sm:hidden flex items-center justify-between px-3 py-2.5 rounded-lg text-[14px] text-tx2 hover:bg-sf2">
              <span>Wallet</span>
              <span className="flex items-center gap-2 font-mono text-tx"><Coin />{balance === null ? "—" : fmt(balance)}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
