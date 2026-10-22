// OWNER: Celeste
// Validates email and password and takes user to correct dashboard based off the server now

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/client';
import { isValidEmail, isRequired, collectErrors } from '../utils/validation';


export default function Login({ onSignIn }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  // update a field and clear its error if any as the user types
  const update = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // stop the browser from reloading the page
    setServerError('');

    const found = collectErrors({
      email: isValidEmail(form.email),
      password: isRequired(form.password, 'Password'),
    });

    // keep the fields that failed
    const real = Object.fromEntries(
      Object.entries(found).filter(([, message]) => message !== null),
    );

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      const account = await login(form);
      onSignIn(account);
      navigate(account.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="shell">
      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <h1>Sign in</h1>

        {serverError && <p className="error" role="alert">{serverError}</p>}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={update('email')}
            aria-invalid={errors.email ? 'true' : undefined}
            autoComplete="username"
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={update('password')}
            aria-invalid={errors.password ? 'true' : undefined}
            autoComplete="current-password"
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>

        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="hint" style={{ marginTop: '1rem' }}>
          No account yet? <Link to="/register">Create one</Link>.
        </p>
      </form>
    </div>
  );
}
