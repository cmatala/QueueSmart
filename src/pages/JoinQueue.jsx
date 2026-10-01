// OWNER: Megan
// TODO: see the A2 plan for what this screen must do.
// Pick a service, see the estimated wait, join or leave.

import { useState } from 'react';
import ServiceCard from '../components/ServiceCard';
import { getQueue } from '../data/mockData';
import { joinQueue, leaveQueue, positionIn } from '../utils/queueActions';

export default function JoinQueue({ services, entries, setEntries }) {
  const [message, setMessage] = useState('');

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
          <h1>Join a queue</h1>
          <p>Pick a service and see the wait before you commit.</p>
        </div>
      </div>

      {message && <p className="hint" role="status">{message}</p>}

      {services.length === 0 ? (
        <div className="empty">No services are available right now.</div>
      ) : (
        <div className="stack">
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
      )}
    </div>
  );
}
