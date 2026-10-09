import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { Field, Notice, btnPrimary, inputCls } from '../components/ui.jsx';

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

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <AuthShell title="Create your account" subtitle="Free to join. Start trading in minutes.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Username" htmlFor="su-username">
          <input id="su-username" type="text" autoComplete="username" placeholder="Choose a username" value={form.username} onChange={set('username')} required className={inputCls} />
        </Field>
        <Field label={<>Email <span className="text-mu font-normal">(optional)</span></>} htmlFor="su-email">
          <input id="su-email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} className={inputCls} />
        </Field>
        <Field label="Password" htmlFor="su-password">
          <input id="su-password" type="password" autoComplete="new-password" placeholder="Create a password" value={form.password} onChange={set('password')} required className={inputCls} />
        </Field>
        <Field label="Confirm password" htmlFor="su-confirm">
          <input id="su-confirm" type="password" autoComplete="new-password" placeholder="Repeat your password" value={form.confirm} onChange={set('confirm')} required className={inputCls} />
        </Field>

        {error && <Notice kind="err">{error}</Notice>}

        <button type="submit" disabled={loading} className={`${btnPrimary} !h-12 !rounded-[11px] !text-[15px] mt-1`}>
          {loading ? 'Creating account…' : 'Create account →'}
        </button>
      </form>

      <p className="mt-6 text-[14px] text-mu text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-pr hover:text-prh font-medium">Sign in</Link>
      </p>

      <p className="mt-8 pt-6 border-t border-bd text-[12.5px] leading-[1.6] text-mu">
        By signing up you agree to trade responsibly. Pryzm uses virtual currency (PZC) only; no real money is ever at risk.
      </p>
    </AuthShell>
  );
}
