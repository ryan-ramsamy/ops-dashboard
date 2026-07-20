import { useState } from 'react';
import { supabase } from '../supabaseClient.js';

// Email/password only — no signup, no social login, no "forgot
// password" link. The one account is created manually in the Supabase
// dashboard (Authentication -> Users -> Add user), not through this UI.
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <h1 className="login-title">Ops dashboard</h1>
        <p className="login-sub">Sign in to continue</p>

        <label className="field-label" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          className="input"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
        />

        <label className="field-label" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          className="input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
