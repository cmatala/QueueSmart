// OWNER: Celeste
/* No one can register as admin but creates regular user accounts, and password confirmation is done 
in browser */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/client';
import { isRequired, isValidEmail, minLength, collectErrors } from '../utils/validation';

const PASSWORD_MIN = 8;

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const update = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
  };

  const handleSubmit = async (event) => {
      event.preventDefault();
      setServerError('');
  
      const found = collectErrors({
        name: isRequired(form.name, 'Name'),
        email: isValidEmail(form.email),
        password: minLength(form.password, PASSWORD_MIN, 'Password'),
        confirm: form.confirm === form.password ? null : 'The two passwords do not match.',
      });
  
      setErrors(found);
      if (Object.keys(found).length > 0) return;
  
      setBusy(true);
      try {
        await register({ name: form.name, email: form.email, password: form.password });
        setDone(true);
      } catch (error) {
        setServerError(error.message);
      } finally {
        setBusy(false);
      }
    };

  if (done) {
    return (
      <div className="shell">
        <div className="card form-card">
          <h1>Account created</h1>
          <p className="muted">
            Welcome, {form.name.trim()}. You can sign in with {form.email.trim()}.
          </p>
          <button type="button" className="btn-primary" onClick={() => navigate('/login')}>
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
      <div className="shell">
        <form className="card form-card" onSubmit={handleSubmit} noValidate>
          <h1>Create your account</h1>
  
          {serverError && <p className="error" role="alert">{serverError}</p>}
  
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              value={form.name}
              onChange={update('name')}
              aria-invalid={errors.name ? 'true' : undefined}
              autoComplete="name"
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>
  
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
              autoComplete="new-password"
            />
            {errors.password
              ? <span className="error">{errors.password}</span>
              : <span className="hint">At least {PASSWORD_MIN} characters.</span>}
          </div>
  
          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              value={form.confirm}
              onChange={update('confirm')}
              aria-invalid={errors.confirm ? 'true' : undefined}
              autoComplete="new-password"
            />
            {errors.confirm && <span className="error">{errors.confirm}</span>}
          </div>
  
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
  
          <p className="hint" style={{ marginTop: '1rem' }}>
            Already have one? <Link to="/login">Sign in</Link>.
          </p>
        </form>
      </div>
    );
}
