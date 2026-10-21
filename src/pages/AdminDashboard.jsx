// OWNER: Celestin
//
// Every service, how many are waiting, and open/close in one click.
//
// The waiting counts come from GET /api/services, which works them out from
// the live queue. A2 counted entries in the browser; this cannot drift.

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getServices, setServiceOpen } from '../api/client';
import ServiceCard from '../components/ServiceCard';

export default function AdminDashboard({ account }) {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(null);

  const load = useCallback(() =>
    getServices()
      .then((data) => { setServices(data); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false)), []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (service) => {
    setWorking(service.id);
    try {
      const updated = await setServiceOpen(service.id, !service.isOpen, account.id);
      // Swap in the server's version of the row rather than guessing at it.
      setServices((current) => current.map((s) => (s.id === updated.id ? updated : s)));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking(null);
    }
  };

  if (loading) return <div className="shell"><p className="muted">Loading…</p></div>;

  const totalWaiting = services.reduce((sum, s) => sum + (s.waiting ?? 0), 0);
  const openCount = services.filter((s) => s.isOpen).length;

  return (
    <div className="shell">
      <div className="page-head">
        <div>
          <h1>Service overview</h1>
          <p>
            {totalWaiting} people waiting across {openCount} open{' '}
            {openCount === 1 ? 'service' : 'services'}.
          </p>
        </div>
        <div className="btn-row">
          <button type="button" onClick={load}>Refresh</button>
          <button type="button" onClick={() => navigate('/admin/services')}>
            Manage services
          </button>
          <button type="button" className="btn-primary" onClick={() => navigate('/admin/queues')}>
            Manage queues
          </button>
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="grid">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            actions={
              <div className="btn-row">
                <button
                  type="button"
                  disabled={working === service.id}
                  onClick={() => handleToggle(service)}
                >
                  {service.isOpen ? 'Close queue' : 'Open queue'}
                </button>
                <button
                  type="button"
                  className="btn-quiet"
                  onClick={() => navigate(`/admin/queues?service=${service.id}`)}
                >
                  View
                </button>
              </div>
            }
          />
        ))}
      </div>

      {services.length === 0 && (
        <div className="empty">
          <p>No services yet.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/admin/services')}>
            Create the first one
          </button>
        </div>
      )}
    </div>
  );
}