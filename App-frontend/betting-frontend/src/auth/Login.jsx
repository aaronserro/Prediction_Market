import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { Field, Notice, btnPrimary, btnSecondary, inputCls } from '../components/ui.jsx';

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '', mfaCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const mfaCode = form.mfaCode.trim();
    if (mfaCode && !/^\d{6}$/.test(mfaCode)) {
      setError('Administrator MFA code must be exactly six digits.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.username.trim(), form.password, mfaCode);
      const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ADMIN');
      nav(isAdmin ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back." subtitle="Sign in to your account to continue trading.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Username" htmlFor="login-username">
          <input
            id="login-username"
            type="text"
            autoComplete="username"
            placeholder="Your username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Password" htmlFor="login-password">
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Administrator MFA code (if required)" htmlFor="login-mfa">
          <input
            id="login-mfa"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="6-digit code"
            value={form.mfaCode}
            onChange={(e) => setForm({ ...form, mfaCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            className={inputCls}
          />
        </Field>

        {error && <Notice kind="err">{error}</Notice>}

        <button type="submit" disabled={loading} className={`${btnPrimary} !h-12 !rounded-[11px] !text-[15px] mt-1`}>
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>

      <div className="my-7 flex items-center gap-3 text-xs text-mu">
        <div className="flex-1 h-px bg-bd" />
        New here?
        <div className="flex-1 h-px bg-bd" />
      </div>

      <Link to="/signup" className={`${btnSecondary} w-full !h-12 !rounded-[11px] !text-[15px]`}>
        Create a free account
      </Link>

      <p className="mt-7 text-[13px] text-mu">
        Questions?{' '}
        <a href="mailto:pryzmcompany@gmail.com" className="text-pr hover:text-prh">pryzmcompany@gmail.com</a>
      </p>
    </AuthShell>
  );
}
