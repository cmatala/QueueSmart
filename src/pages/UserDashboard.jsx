// OWNER: Megan
// TODO: see the A2 plan for what this screen must do.
// Current queue position first, then joinable services and notifications.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';
import Notification from '../components/Notification';
import StatusBadge from '../components/StatusBadge';
import {
  CURRENT_USER_ID,
  notifications,
  getUser,
  getQueue,
  formatWait,
} from '../data/mockData';
import { joinQueue, leaveQueue, positionIn } from '../utils/queueActions';

export default function UserDashboard({ services, entries, setEntries }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  const user = getUser(CURRENT_USER_ID);
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  // Services the user is currently waiting in
  const mine = services
    .map((service) => {
      const queue = getQueue(entries, service.id);
      return { service, queue, position: positionIn(queue) };
    })
    .filter((item) => item.position > 0);

  const current = mine[0]; // highlight the first one
  const myNotifications = notifications.filter((n) => n.userId === CURRENT_USER_ID);

  const handleJoin = (service) => {
    setEntries(joinQueue(entries, service));
    setMessage(`You joined ${service.name}.`);
  };
  const handleLeave = (service) => {
    setEntries(leaveQueue(entries, service.id));
    setMessage(`You left ${service.name}.`);
  };

  return (
    <div className="shell">
      <div className="page-head">
        <div>
          <h1>Welcome back, {firstName}</h1>
          <p>Here is where you stand.</p>
        </div>
      </div>

      {current ? (
        <div className="card card-hilite">
          <div className="card-head">
            <h2>{current.service.name}</h2>
            <StatusBadge status={current.position === 1 ? 'almost ready' : 'waiting'} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.2 }}>
            Position {current.position} of {current.queue.length}
          </div>
          <p className="muted" style={{ margin: '.3rem 0 .8rem' }}>
            about {formatWait((current.position - 1) * current.service.expectedDuration)}
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
      {message && <p className="hint" role="status">{message}</p>}
      <div className="grid">
        {services.map((service) => {
          const queue = getQueue(entries, service.id);
          return (
            <ServiceCard
              key={service.id}
              service={service}
              waiting={queue.length}
              position={positionIn(queue)}
              onJoin={handleJoin}
              onLeave={handleLeave}
            />
          );
        })}
      </div>

      <h2 style={{ marginTop: '2rem' }}>Notifications</h2>
      {myNotifications.length === 0 ? (
        <div className="empty">No notifications yet.</div>
      ) : (
        <div className="stack">
          {myNotifications.map((n) => (
            <Notification key={n.id} message={n.message} time={n.time} unread={n.unread} />
          ))}
        </div>
      )}
    </div>
  );
}
