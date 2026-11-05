// OWNER: Celeste
// First screen any user sees before signing in

import { Link } from 'react-router-dom';

export default function Welcome() {
  return (
    <div className="shell">
      <div className="card form-card" style={{ maxWidth: 540 }}>
        <h1>Queue<span style={{ color: 'var(--red)' }}>Smart</span></h1>

        <p className="muted">
          Join a campus service queue from your phone, see where you are in
          line, and get told when you are nearly up. No more standing in a
          corridor guessing how long is left.
        </p>

        <div className="btn-row" style={{ marginTop: '1.5rem' }}>
          <Link className="btn btn-primary" to="/login">Sign in</Link>
          <Link className="btn" to="/register">Create an account</Link>
        </div>

        <p className="hint" style={{ marginTop: '1.5rem' }}>
          Demo accounts: alex@queuesmart.edu / alex1234 for a student,
          admin@queuesmart.edu / admin123 for staff.
        </p>
      </div>
    </div>
  );
}
