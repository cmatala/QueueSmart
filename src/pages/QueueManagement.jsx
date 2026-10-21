// OWNER: Celestin
//
// The staff view of one queue: reorder it, remove someone, serve the next
// person.
//
// Every action reloads from the server afterwards. That is slightly more
// network traffic than patching the list in place, but it means the screen
// can never show an order the server disagrees with, which matters most on
// the one screen two staff might have open at once.

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getServices, getQueue, serveNext, moveEntry, leaveQueue } from '../api/client';

export default function QueueManagement() {
  const [params, setParams] = useSearchParams();

  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState(params.get('service') ?? '');
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Load the service list once, and pick the first one if the URL did not
  // name a service.
  useEffect(() => {
    getServices()
      .then((data) => {
        setServices(data);
        setServiceId((current) => current || data[0]?.id || '');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const loadQueue = useCallback(async (id) => {
    if (!id) return;
    try {
      setQueue(await getQueue(id));
      setError('');
    } catch (e) {
      setError(e.message);
      setQueue([]);
    }
  }, []);

  useEffect(() => { loadQueue(serviceId); }, [serviceId, loadQueue]);

  const chooseService = (id) => {
    setServiceId(id);
    setParams(id ? { service: id } : {});
    setNotice('');
  };

  // Wraps an action so that every one of them reloads and reports the same way.
  const run = async (action, success) => {
    setBusy(true);
    setNotice('');
    try {
      await action();
      setNotice(success);
      setError('');
      await Promise.all([
        loadQueue(serviceId),
        getServices().then(setServices),
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="shell"><p className="muted">Loading…</p></div>;

  const service = services.find((s) => s.id === serviceId);

  return (
    <div className="shell">
      <div className="page-head">
        <div>
          <h1>Queues</h1>
          <p>Reorder, remove, or serve the next person.</p>
        </div>
        <div className="btn-row">
          <button
            type="button"
            className="btn-primary"
            disabled={busy || queue.length === 0}
            onClick={() => run(() => serveNext(serviceId), 'Served the next person.')}
          >
            Serve next
          </button>
        </div>
      </div>

      <div className="field" style={{ maxWidth: 320 }}>
        <label htmlFor="service">Service</label>
        <select id="service" value={serviceId} onChange={(e) => chooseService(e.target.value)}>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.waiting} waiting){s.isOpen ? '' : ' — closed'}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {notice && <p className="muted" role="status">{notice}</p>}

      {service && (
        <p className="faint">
          {service.expectedDuration} min per visit · {queue.length} waiting
        </p>
      )}

      {queue.length === 0 ? (
        <div className="empty"><p>Nobody is waiting for this service.</p></div>
      ) : (
        <div className="queue-list">
          {queue.map((entry) => (
            <div
              key={entry.id}
              className={`queue-row${entry.position === 1 ? ' is-next' : ''}`}
            >
              <span className="pos">{entry.position}</span>

              <div>
                <div className="row-name">{entry.userName}</div>
                <div className="faint">
                  joined {entry.joinedAt} · about {entry.wait} min
                </div>
              </div>

              <div className="btn-row">
                <button
                  type="button"
                  disabled={busy || entry.position === 1}
                  onClick={() => run(() => moveEntry(entry.id, 'up'), 'Moved up.')}
                  aria-label={`Move ${entry.userName} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={busy || entry.position === queue.length}
                  onClick={() => run(() => moveEntry(entry.id, 'down'), 'Moved down.')}
                  aria-label={`Move ${entry.userName} down`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  disabled={busy}
                  onClick={() => run(() => leaveQueue(entry.id), `Removed ${entry.userName}.`)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}