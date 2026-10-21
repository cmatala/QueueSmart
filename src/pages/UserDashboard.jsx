// OWNER: Megan
// Current queue position first, then joinable services and notifications.
// Everything comes from the API; no numbers are worked out on this screen.

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';
import Notification from '../components/Notification';
import StatusBadge from '../components/StatusBadge';
import useQueueData from '../utils/useQueueData';
import { getNotifications } from '../utils/servicesApi';
import { formatWait } from '../utils/formatWait';

// TODO: remove this fallback once App.jsx passes the signed-in user as `user`.
const TEMP_USER_ID = 'u2';

export default function UserDashboard({ user }) {
  const navigate = useNavigate();
  const userId = user?.id ?? TEMP_USER_ID;
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const { services, status, loading, error, notice, reload, join, leave, positionIn } =
    useQueueData(userId);

  const [notifications, setNotifications] = useState([]);
  const [notifError, setNotifError] = useState('');

  const loadNotifications = useCallback(async () => {
    try {
      setNotifications(await getNotifications(userId));
      setNotifError('');
    } catch (err) {
      setNotifError(err.message);
    }
  }, [userId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Joining creates a notification on the server, so fetch the list again.
  const handleJoin = async (service) => {
    await join(service);
    loadNotifications();
  };
  const handleLeave = async (service) => {
    await leave(service);
    loadNotifications();
  };

  if (loading) {
    return (
      <div className="shell">
        <div className="empty">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shell">
        <div className="empty" role="alert">
          <p style={{ margin: '0 0 .8rem' }}>{error}</p>
          <button type="button" className="btn-primary" onClick={reload}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  // The service the user is waiting in, with the server's own numbers.
  const currentService = status ? services.find((s) => s.name === status.service) : null;

  return (
    <div className="shell">
      <div className="page-head">
        <div>
          <h1>Welcome back, {firstName}</h1>
          <p>Here is where you stand.</p>
        </div>
      </div>

      {status ? (
        <div className="card card-hilite">
          <div className="card-head">
            <h2>{status.service}</h2>
            <StatusBadge status={status.status} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.2 }}>
            Position {status.position}
            {currentService ? ` of ${currentService.waiting}` : ''}
          </div>
          <p className="muted" style={{ margin: '.3rem 0 .8rem' }}>
            {status.position === 1 ? 'You are next' : `about ${formatWait(status.wait)}`}
          </p>
          <button type="button" className="btn-primary" onClick={() => navigate('/status')}>
            View status
          </button>
        </div>
      ) : (
        <div className="empty">
          <p style={{ margin: '0 0 .8rem' }}>You are not in a queue.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/join')}>
            Join a queue
          </button>
        </div>
      )}

      <h2 style={{ marginTop: '2rem' }}>Services you can join</h2>
      {notice && (
        <p className="hint" role={notice.isError ? 'alert' : 'status'}>
          {notice.text}
        </p>
      )}
      <div className="grid">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            waiting={service.waiting}
            position={positionIn(service)}
            onJoin={handleJoin}
            onLeave={handleLeave}
          />
        ))}
      </div>

      <h2 style={{ marginTop: '2rem' }}>Notifications</h2>
      {notifError ? (
        <div className="empty" role="alert">{notifError}</div>
      ) : notifications.length === 0 ? (
        <div className="empty">No notifications yet.</div>
      ) : (
        <div className="stack">
          {notifications.map((n) => (
            <Notification key={n.id} message={n.message} time={n.time} unread={n.unread} />
          ))}
        </div>
      )}
    </div>
  );
}
