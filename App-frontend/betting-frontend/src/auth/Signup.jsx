import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

const PERKS = [
  { icon: '⚡', text: 'Trade on live markets in real time' },
  { icon: '📈', text: 'Track your P&L and full portfolio' },
  { icon: '🏆', text: 'Climb the ranks and beat the crowd' },
  { icon: '🔒', text: 'Virtual currency only — pure skill' },
];

export default function Signup() {
  const nav = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await signup(form.username.trim(), form.email.trim() || null, form.password);
      nav('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b0e14] flex items-center justify-center p-4">

      {/* Left panel — large screens only */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] h-full max-h-[720px] pr-16">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-700/50">
            <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="bolt-grad-s" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fde68a"/>
                  <stop offset="100%" stopColor="#f59e0b"/>
                </linearGradient>
              </defs>
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" fill="url(#bolt-grad-s)"/>
            </svg>
          </div>
          <span className="text-sm font-bold bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent tracking-tight">
            Pryzm
          </span>
        </Link>

        <div>
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">
            Join the platform
          </p>
          <h2 className="text-3xl font-bold text-white leading-snug mb-6">
            Your edge on the world<br />
            <span className="text-amber-400">starts here.</span>
          </h2>
          <ul className="space-y-3.5">
            {PERKS.map((p) => (
              <li key={p.text} className="flex items-center gap-3">
                <span className="text-lg leading-none">{p.icon}</span>
                <span className="text-sm text-slate-400">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-600">© 2026 Pryzm. No real money involved.</p>
      </div>

      {/* Divider */}
      <div className="hidden lg:block w-px h-[560px] bg-white/[0.06]" />

      {/* Form panel */}
      <div className="w-full max-w-sm lg:pl-16">
        {/* Mobile logo */}
        <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#fbbf24">
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span className="text-sm font-bold bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
            Pryzm
          </span>
        </Link>

        <div className="mb-7">
          <h1 className="text-2xl font-semibold text-white mb-1">Create your account</h1>
          <p className="text-sm text-slate-500">Free to join — start trading in minutes</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              placeholder="Choose a username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.05] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Email{' '}
              <span className="text-slate-600 normal-case font-normal">(optional)</span>
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.05] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.05] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              required
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.05] transition-all"
            />
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-500/[0.08] border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md bg-gradient-to-r from-amber-400 to-amber-500 text-[#1a0a00] text-sm font-black hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-900/20"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-slate-300 hover:text-white transition-colors font-medium">
            Sign in
          </Link>
        </p>

        <div className="mt-8 pt-6 border-t border-white/[0.06]">
          <p className="text-xs text-slate-600 leading-relaxed">
            By signing up you agree to trade responsibly. Pryzm uses virtual currency only —
            no real money is ever at risk.
          </p>
        </div>
      </div>
    </div>
  );
}
