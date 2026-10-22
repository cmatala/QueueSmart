// OWNER: Megan
//
// The screen a student lands on. Pulls three things at once: where they
// stand in a queue, their unread notifications, and the open services.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getUserStatus, getNotifications, getServices } from '../api/client';
import Notification from '../components/Notification';

export default function UserDashboard({ account }) {
  const navigate = useNavigate();

  const [status, setStatus] = useState(null);
  const [notes, setNotes] = useState([]);
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Runs once when the screen opens, and again if the account changes.
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getUserStatus(account.id),
      getNotifications(account.id),
      getServices(),
    ])
      .then(([statusData, notesData, servicesData]) => {
        // The guard stops React warning when the user navigates away before
        // the responses arrive.
        if (cancelled) return;
        setStatus(statusData);
        setNotes(notesData);
        setServices(servicesData);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [account.id]);

  if (loading) return <div className="shell"><p className="muted">Loading…</p></div>;

  if (error) {
    return (
      <div className="shell">
        <div className="empty">
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>Try again</button>
        </div>
      </div>
    );
  }

  const unread = notes.filter((n) => n.unread).length;
  const openServices = services.filter((s) => s.isOpen).length;

  return (
    <div className="shell">
      <div className="page-head">
        <div>
          <h1>Hello, {account.name.split(' ')[0]}</h1>
          <p>
            {openServices} {openServices === 1 ? 'service is' : 'services are'} open right now.
          </p>
        </div>
        <div className="btn-row">
          <button type="button" className="btn-primary" onClick={() => navigate('/join')}>
            Join a queue
          </button>
        </div>
      </div>

      <div className="split">
        <div className="stack">
          <section className="card">
            <h2>Your place in line</h2>

            {status ? (
              <>
                <p className="muted" style={{ marginBottom: '.25rem' }}>{status.service}</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
                  #{status.position}
                </p>
                <p className="faint">
                  {status.status === 'almost ready'
                    ? 'You are next. Please make your way over.'
                    : `About ${status.wait} minutes to go.`}
                </p>
                <button type="button" onClick={() => navigate('/status')}>
                  See the full queue
                </button>
              </>
            ) : (
              <>
                <p className="muted">You are not in a queue at the moment.</p>
                <button type="button" className="btn-primary" onClick={() => navigate('/join')}>
                  Find a service
                </button>
              </>
            )}
          </section>
        </div>

        <aside className="stack">
          <section className="card">
            <div className="card-head">
              <h2 style={{ margin: 0 }}>Notifications</h2>
              {unread > 0 && <span className="badge badge-high">{unread} new</span>}
            </div>

            {notes.length === 0 ? (
              <p className="faint">Nothing yet.</p>
            ) : (
              <div className="stack" style={{ gap: '.5rem' }}>
                {notes.slice(0, 5).map((note) => (
                  <Notification key={note.id} {...note} />
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
