import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username.trim(), form.password);
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const meRes = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
      if (meRes.ok) {
        const userData = await meRes.json();
        const isAdmin = userData?.roles?.includes('ROLE_ADMIN') || userData?.roles?.includes('ADMIN');
        nav(isAdmin ? '/admin' : '/dashboard');
      } else {
        nav('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b0e14] flex items-center justify-center p-4">
      {/* Left panel — large screens only */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] h-full max-h-[680px] pr-16">
        <Link to="/" className="text-xl font-bold text-white tracking-tight">Pryzm</Link>
        <div>
          <blockquote className="text-2xl font-medium text-white leading-snug mb-4">
            "The market is always right — the question is whether you are."
          </blockquote>
          <p className="text-sm text-slate-500">Trade on what you know. Pryzm turns insight into outcome.</p>
        </div>
        <p className="text-xs text-slate-600">© 2026 Pryzm</p>
      </div>

      {/* Divider */}
      <div className="hidden lg:block w-px h-[480px] bg-white/[0.06]" />

      {/* Form panel */}
      <div className="w-full max-w-sm lg:pl-16">
        {/* Mobile logo */}
        <Link to="/" className="lg:hidden block text-xl font-bold text-white tracking-tight mb-8">Pryzm</Link>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-slate-500">Sign in to your account to continue</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:border-white/[0.25] focus:bg-white/[0.05] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:border-white/[0.25] focus:bg-white/[0.05] transition-all"
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
            className="w-full py-2.5 px-4 rounded-md bg-white text-[#0b0e14] text-sm font-semibold hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/[0.06]">
          <p className="text-xs text-slate-600 leading-relaxed">
            Pryzm lets you turn your opinions into ranked predictions using virtual currency.{' '}
            Questions?{' '}
            <a href="mailto:pryzmcompany@gmail.com" className="text-slate-400 hover:text-white transition-colors">
              pryzmcompany@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

