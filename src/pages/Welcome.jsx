// OWNER: Celeste
// First screen any user sees before signing in

import { Link } from 'react-router-dom';

export default function Welcome() {
  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <span className="brand">QueueSmart</span>
          <div className="nav-links">
            <Link to="/login">Sign in</Link>
            <Link className="btn btn-primary" to="/register">Register</Link>
          </div>
        </div>
      </nav>

      <div className="shell">
        <div className="split">
          <div>
            <h1 style={{ fontSize: '2rem' }}>
              Know your wait<br />before you get in line.
            </h1>
            <p className="muted">
              Join a queue from your phone, see your position and estimated wait,
              and get notified when it is your turn.
            </p>
            <div className="btn-row" style={{ marginTop: '1.5rem' }}>
              <Link className="btn btn-primary" to="/register">Register</Link>
              <Link className="btn" to="/login">Sign in</Link>
            </div>
          </div>

          <div className="card card-hilite">
            <span className="faint">Academic Advising</span>
            <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.1 }}>
              3rd in line
            </div>
            <p style={{ margin: '.3rem 0 .6rem' }}>about 15 minutes</p>
            <span className="badge badge-waiting">almost ready</span>
            <p className="faint" style={{ marginTop: '.8rem', marginBottom: 0 }}>
              We will notify you when it is your turn.
            </p>
          </div>
        </div>

        <div className="grid" style={{ marginTop: '2.5rem' }}>
          <article className="card">
            <h3>Join from anywhere</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              No standing in a hallway. Queue before you arrive.
            </p>
          </article>
          <article className="card">
            <h3>See your real wait</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              Position and estimated time, updated as the queue moves.
            </p>
          </article>
          <article className="card">
            <h3>Get notified</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              A heads-up when your turn is close, so you are ready.
            </p>
          </article>
        </div>

        <p className="faint" style={{ marginTop: '2rem' }}>
          Staff members use the same <Link to="/login">Sign in</Link> — administrator
          accounts open the admin dashboard.
        </p>
      </div>
    </>
  );
}
