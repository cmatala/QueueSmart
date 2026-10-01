// OWNER: Celestin
// One person in a queue. Used on Queue Management and Queue Status.

import StatusBadge from './StatusBadge';

export default function QueueCard({ position, name, detail, status, actions }) {
  return (
    <div className={`queue-row${position === 1 ? ' is-next' : ''}`}>
      <span className="pos">{position}</span>

      <div>
        <div className="row-name">{name}</div>
        {detail && <div className="faint">{detail}</div>}
      </div>

      <div className="btn-row">
        {status && <StatusBadge value={status} />}
        {actions}
      </div>
    </div>
  );
}
