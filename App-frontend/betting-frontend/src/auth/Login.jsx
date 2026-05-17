import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username.trim(), form.password);
      const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://api.pryzm.ca' : 'http://localhost:8080');
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

  const inputStyle = (name) => ({
    width: '100%',
    padding: '12px 16px',
    background: focused === name ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${focused === name ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: '10px',
    fontSize: '14px',
    color: 'white',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: focused === name ? '0 0 0 3px rgba(139,92,246,0.1)' : 'none',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#080b10', display: 'flex', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: rgba(255,255,255,0.18); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-glow { 0%,100% { opacity: 0.3; } 50% { opacity: 0.6; } }
        .form-wrap { animation: fadeUp 0.5s ease both; }
        .login-shell { width: 100%; max-width: none; min-height: 100%; display: flex; }
        .right-panel { flex: 1; }
        @media(min-width:1024px){
          .login-shell { margin: 0; min-height: 100%; border: none; border-radius: 0; overflow: hidden; box-shadow: none; }
          .lg-panel { display: flex !important; flex: 1 !important; width: 50% !important; }
          .right-panel { flex: 1; width: 50%; }
        }
        .submit-btn {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #f59e0b, #f97316);
          border: none; border-radius: 10px;
          color: #1a0800; font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s ease; letter-spacing: -0.01em;
          box-shadow: 0 0 30px rgba(249,115,22,0.25);
        }
        .submit-btn:hover:not(:disabled) { filter: brightness(1.08); box-shadow: 0 0 50px rgba(249,115,22,0.35); transform: translateY(-1px); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ticker-item { display: flex; flex-direction: column; gap: 4px; }
        @keyframes ticker-v { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
      `}</style>

      <div className="login-shell">

      {/* Left panel */}
      <div style={{ display: 'none', flexDirection: 'column', width: '50%', flexShrink: 0, position: 'relative', overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,0.06)' }}
        className="lg-panel">
        <style>{`@media(min-width:1024px){.lg-panel{display:flex!important;}}`}</style>

        {/* Background effects */}
        <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(139,92,246,0.12)', filter: 'blur(80px)', top: '-100px', left: '-100px', animation: 'pulse-glow 7s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(245,158,11,0.08)', filter: 'blur(60px)', bottom: '100px', right: '-50px', animation: 'pulse-glow 5s ease-in-out infinite 2s', pointerEvents: 'none' }} />

        {/* Grid overlay */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '50px 50px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', padding: '40px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(109,40,217,0.5)', border: '1px solid rgba(167,139,250,0.35)', flexShrink: 0 }}>
              <svg style={{ width: '15px', height: '15px', filter: 'drop-shadow(0 0 3px rgba(251,191,36,0.85))' }} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="loginBoltDesktop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <path fill="url(#loginBoltDesktop)" d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '8px', background: 'rgba(196,181,253,0.2)', filter: 'blur(7px)', zIndex: -1 }} />
            </div>
            <span style={{ fontSize: '16px', fontWeight: 700, background: 'linear-gradient(to right, #a78bfa, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>Pryzm</span>
          </Link>

          {/* Quote */}
          <div>
            <div style={{ width: '32px', height: '2px', background: 'linear-gradient(to right, #8b5cf6, #f59e0b)', borderRadius: '2px', marginBottom: '24px' }} />
            <blockquote style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 300, fontStyle: 'italic', color: 'white', lineHeight: 1.35, marginBottom: '20px', letterSpacing: '-0.01em' }}>
              "The market is always right — the question is whether you are."
            </blockquote>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, fontWeight: 300 }}>
              Trade on what you know. Pryzm turns insight into outcome.
            </p>

            {/* Live market pills */}
            <div style={{ marginTop: '36px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'BTC > $100K by EOY', val: '61%', up: true },
                { label: 'US Rate Cut — Sep', val: '44%', up: false },
                { label: 'Next G7 Host Country', val: '38%', up: true },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{m.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: "'DM Mono', monospace", color: m.up ? '#4ade80' : '#f87171', background: m.up ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)', padding: '2px 8px', borderRadius: '6px' }}>{m.val}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)' }}>© 2026 Pryzm</p>
        </div>
      </div>

      {/* Right / form panel */}
      <div className="right-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '380px' }} className="form-wrap">

          {/* Mobile logo */}
          <style>{`@media(min-width:1024px){.mobile-logo{display:none!important;}}`}</style>
          <Link to="/" className="mobile-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px' }}>
            <div style={{ position: 'relative', width: '26px', height: '26px', borderRadius: '7px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(109,40,217,0.45)', border: '1px solid rgba(167,139,250,0.35)' }}>
              <svg style={{ width: '14px', height: '14px', filter: 'drop-shadow(0 0 3px rgba(251,191,36,0.85))' }} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="loginBoltMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <path fill="url(#loginBoltMobile)" d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, background: 'linear-gradient(to right, #a78bfa, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>Pryzm</span>
          </Link>

          {/* Heading */}
          <div style={{ marginBottom: '36px' }}>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '32px', fontWeight: 300, color: 'white', marginBottom: '8px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Welcome back.
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>Sign in to your account to continue trading.</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '8px' }}>
                Username
              </label>
              <input
                type="text"
                placeholder="your username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                onFocus={() => setFocused('username')}
                onBlur={() => setFocused('')}
                style={inputStyle('username')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '8px' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                style={inputStyle('password')}
              />
            </div>

            {error && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)' }}>
                <p style={{ fontSize: '13px', color: '#f87171', fontWeight: 400 }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="submit-btn" style={{ marginTop: '4px' }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ margin: '28px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>NEW HERE?</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <Link to="/signup" style={{
            display: 'block', width: '100%', padding: '13px',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
            background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)',
            fontSize: '14px', fontWeight: 500, textAlign: 'center',
            textDecoration: 'none', transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.color = 'white'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.color = 'rgba(255,255,255,0.6)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
          >
            Create a free account
          </Link>

          {/* Footer note */}
          <p style={{ marginTop: '28px', fontSize: '12px', color: 'rgba(255,255,255,0.18)', lineHeight: 1.7, fontWeight: 300 }}>
            Questions?{' '}
            <a href="mailto:pryzmcompany@gmail.com" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}
            >pryzmcompany@gmail.com</a>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}