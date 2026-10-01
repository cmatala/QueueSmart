// OWNER: Celestin
// View a service queue, reorder, remove, serve next.

import { useState } from 'react';
import QueueCard from '../components/QueueCard';
import {
  getQueue,
  getUser,
  estimateWait,
  formatWait,
  STATUS,
} from '../data/mockData';

export default function QueueManagement({ services, entries, setEntries }) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '');
  const [message, setMessage] = useState('');

  const service = services.find((s) => s.id === serviceId);
  const queue = getQueue(entries, serviceId);

  // Move an entry up or down by swapping it with its neighbour, then
  // writing the reordered queue back into the full entries list.
  const move = (entryId, direction) => {
    const index = queue.findIndex((e) => e.id === entryId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= queue.length) return;

    const movedName = getUser(queue[index].userId)?.name ?? 'Entry';

    const reordered = [...queue];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    let slot = 0;
    setEntries(
      entries.map((entry) =>
        entry.serviceId === serviceId && entry.status === STATUS.WAITING
          ? reordered[slot++]
          : entry,
      ),
    );
    setMessage(`Moved ${movedName} ${direction < 0 ? 'up' : 'down'}.`);
  };

  const remove = (entryId) => {
    const entry = queue.find((e) => e.id === entryId);
    const name = getUser(entry?.userId)?.name ?? 'Entry';
    setEntries(entries.filter((e) => e.id !== entryId));
    setMessage(`Removed ${name} from the queue.`);
  };

  const serveNext = () => {
    const next = queue[0];
    if (!next) return;
    const name = getUser(next.userId)?.name ?? 'Next person';
    setEntries(
      entries.map((e) => (e.id === next.id ? { ...e, status: STATUS.SERVED } : e)),
    );
    setMessage(`${name} marked as served.`);
  };

  return (
    <div className="shell">
      <div className="page-head">
        <div>
          <h1>Queue management</h1>
          <p>Reorder, remove, or serve the people waiting for a service.</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={serveNext}
          disabled={queue.length === 0}
        >
          Serve next
        </button>
      </div>

      <div className="field" style={{ maxWidth: '320px' }}>
        <label htmlFor="svc-select">Service</label>
        <select
          id="svc-select"
          value={serviceId}
          onChange={(event) => {
            setServiceId(event.target.value);
            setMessage('');
          }}
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {service && (
        <p className="muted">
          {queue.length} waiting · {service.expectedDuration} min per visit ·{' '}
          {service.isOpen ? 'queue open' : 'queue closed'}
        </p>
      )}

      {message && <p className="hint">{message}</p>}

      {queue.length === 0 ? (
        <div className="empty">Nobody is waiting for this service right now.</div>
      ) : (
        <div className="queue-list">
          {queue.map((entry, index) => {
            const person = getUser(entry.userId);
            const wait = formatWait(estimateWait(index, serviceId));
            return (
              <QueueCard
                key={entry.id}
                position={index + 1}
                name={person?.name ?? 'Unknown user'}
                detail={`joined ${entry.joinedAt} · ${entry.priority} priority · about ${wait}`}
                status={index === 0 ? STATUS.ALMOST_READY : entry.status}
                actions={
                  <>
                    <button
                      type="button"
                      onClick={() => move(entry.id, -1)}
                      disabled={index === 0}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => move(entry.id, 1)}
                      disabled={index === queue.length - 1}
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => remove(entry.id)}
                    >
                      Remove
                    </button>
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}