import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

const page = {
  position: 'fixed', inset: 0,            // <- fills entire viewport
  display: 'grid', placeItems: 'center',
  padding: 16,
  background: 'linear-gradient(to bottom, #0b0b0f, #0f0f14, #000)'
};
const card = {
  width: '100%', maxWidth: 440,
  background: 'rgba(17,17,17,0.92)',
  border: '1px solid #FFD700',
  borderRadius: 16,
  boxShadow: '0 10px 30px rgba(0,0,0,.4)',
  padding: 24, color: '#fff'
};
const input = {
  width: '100%', padding: '12px 14px',
  borderRadius: 12, border: '1px solid #333',
  background: '#1a1a1f', color: '#fff', outline: 'none'
};
const button = {
  width: '100%', height: 48,
  borderRadius: 12, border: '1px solid #FFD700',
  background: '#FFD700', color: '#000', fontWeight: 700, cursor: 'pointer'
};

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const result = await login(form.username.trim(), form.password);

      // Check if user is admin and redirect accordingly
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const meRes = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
      if (meRes.ok) {
        const userData = await meRes.json();
        const isAdmin = userData?.roles?.includes('ROLE_ADMIN') || userData?.roles?.includes('ADMIN');
        nav(isAdmin ? '/admin' : '/dashboard');
      } else {
        nav('/dashboard');
      }
    }
    catch (err) { setError(err.message || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <div style={page}>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Welcome back</h1>
          <p style={{ color: '#bbb', marginTop: 6 }}>Log in to your Betting Dashboard</p>
        </div>

        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <input style={input} placeholder="Username"
                 value={form.username}
                 onChange={e=>setForm({...form, username: e.target.value})}/>
          <input style={input} type="password" placeholder="Password"
                 value={form.password}
                 onChange={e=>setForm({...form, password: e.target.value})}/>
          {error && <div style={{ color: '#ff6b6b', fontSize: 14 }}>{error}</div>}
          <button style={button} disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</button>
        </form>

        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 14 }}>
          No account? <Link to="/signup" style={{ color: '#FFD700' }}>Create one</Link>
        </div>
      </div>
    </div>
  );
}
