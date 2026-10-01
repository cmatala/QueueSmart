// OWNER: Megan
// Shared component: one service; used on Join Queue and Admin Dashboard
// TODO: see the A2 plan.
// One service on the Join Queue and Dashboard screens.
// Props: service, waiting (count), position (0 = not joined), onJoin, onLeave.
// Closed services get a "Closed" label instead of a disabled button.

import StatusBadge from './StatusBadge';
import { formatWait } from '../data/mockData';

export default function ServiceCard({ service, waiting, position, onJoin, onLeave }) {
  const joined = position > 0;
  const waitIfJoin = formatWait(waiting * service.expectedDuration);

  let detail;
  if (!service.isOpen) detail = 'Queue closed';
  else if (joined) detail = `${waiting} waiting · you are in this queue at position ${position}`;
  else detail = `${waiting} waiting · about ${waitIfJoin} if you join now`;

  return (
    <article className="card">
      <div className="card-head">
        <div>
          <h3>{service.name}</h3>
          <span className="faint">{service.expectedDuration} min per visit</span>
        </div>
        <StatusBadge status={service.isOpen ? 'open' : 'closed'} />
      </div>

      <p className="muted" style={{ margin: '0 0 .8rem' }}>{detail}</p>

      {!service.isOpen ? (
        <span className="faint">Closed</span>
      ) : joined ? (
        <button type="button" className="btn-danger" onClick={() => onLeave(service)}>
          Leave
        </button>
      ) : (
        <button type="button" className="btn-primary" onClick={() => onJoin(service)}>
          Join
        </button>
      )}
    </article>
  );
}