// OWNER: Celeste
// No one can register as admin but creates regular user accounts

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { users } from '../data/mockData';
import { isValidEmail, minLength, matches, isRequired } from '../utils/validation';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  const update = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const found = {
      name: isRequired(form.name, 'Name'),
      email: isValidEmail(form.email),
      password: minLength(form.password, 8, 'Password'),
      confirm: matches(form.confirm, form.password),
    };

    // checks if email is already stored and rejects creation if yes
    if (!found.email) {
      const taken = users.some(
        (u) => u.email.toLowerCase() === form.email.trim().toLowerCase(),
      );
      if (taken) found.email = 'An account with that email already exists.';
    }

    const real = Object.fromEntries(
      Object.entries(found).filter(([, message]) => message !== null),
    );

    if (Object.keys(real).length > 0) {
      setErrors(real);
      return;
    }

    setDone(true);
    // send to login to check registration
    setTimeout(() => navigate('/login'), 1500);
  };

  if (done) {
    return (
      <div className="shell">
        <div className="card form-card">
          <h1>Account created</h1>
          <p className="muted">
            Check your email to verify your address. Taking you to sign in…
          </p>
          <Link className="btn btn-primary" to="/login">Sign in now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <h1>Create your account</h1>

        <div className="field">
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={update('name')}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <span className="error">{errors.name}</span>}
        </div>

        <div className="field">
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            value={form.email}
            onChange={update('email')}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email
            ? <span className="error">{errors.email}</span>
            : <span className="hint">This will be your username.</span>}
        </div>

        <div className="field">
          <label htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type="password"
            value={form.password}
            onChange={update('password')}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password
            ? <span className="error">{errors.password}</span>
            : <span className="hint">At least 8 characters.</span>}
        </div>

        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            value={form.confirm}
            onChange={update('confirm')}
            aria-invalid={Boolean(errors.confirm)}
          />
          {errors.confirm && <span className="error">{errors.confirm}</span>}
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          Register
        </button>

        <p className="faint" style={{ marginTop: '1rem' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
