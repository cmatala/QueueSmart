// OWNER: Celeste
// Validates email and password and takes user to correct dashboard

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { users } from '../data/mockData';
import { isValidEmail, isRequired } from '../utils/validation';


export default function Login({ onSignIn }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  // update a field and clear its error if any as the user types
  const update = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const handleSubmit = (event) => {
    event.preventDefault(); // stop the browser from reloading the page

    const found = {
      email: isValidEmail(form.email),
      password: isRequired(form.password, 'Password'),
    };

    // keep the fields that failed
    const real = Object.fromEntries(
      Object.entries(found).filter(([, message]) => message !== null),
    );

    if (Object.keys(real).length > 0) {
      setErrors(real);
      return;
    }

    // look up email in mockdata.js for now
    const account = users.find(
      (u) => u.email.toLowerCase() === form.email.trim().toLowerCase(),
    );

    if (!account) {
      setErrors({ email: 'No account found with that email.' });
      return;
    }

    onSignIn(account);
    navigate(account.role === 'admin' ? '/admin' : '/dashboard');
  };

  return (
    <div className="shell">
      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <h1>Sign in to QueueSmart</h1>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={update('email')}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <span className="error" id="email-error">{errors.email}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={update('password')}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && (
            <span className="error" id="password-error">{errors.password}</span>
          )}
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          Sign in
        </button>

        <p className="faint" style={{ marginTop: '1rem', marginBottom: '.5rem' }}>
          No account? <Link to="/register">Register</Link>
        </p>

        <div className="empty" style={{ padding: '.7rem', textAlign: 'left' }}>
          <strong className="faint">Demo accounts</strong>
          <div className="faint">User: alex@queuesmart.edu</div>
          <div className="faint">Admin: admin@queuesmart.edu</div>
          <div className="faint">Any password works — there is no backend yet.</div>
        </div>
      </form>
    </div>
  );
}
