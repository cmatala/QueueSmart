// OWNER: Megan
//
// Pick a service and join its queue.
//
// The join button is disabled for a closed service and for every service
// once the user is already in a queue. The server enforces both rules; this
// is only so the reason is visible before clicking.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getServices, getUserStatus, joinQueue } from '../api/client';
import ServiceCard from '../components/ServiceCard';

export default function JoinQueue({ account }) {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);   // the id being joined

  const load = () =>
    Promise.all([getServices(), getUserStatus(account.id)])
      .then(([servicesData, statusData]) => {
        setServices(servicesData);
        setStatus(statusData);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.id]);

  const handleJoin = async (serviceId) => {
    setJoining(serviceId);
    setError('');
    try {
      await joinQueue(serviceId, account.id);
      navigate('/status');
    } catch (e) {
      setError(e.message);
      // Reload so the screen reflects whatever the server actually thinks,
      // rather than leaving a stale list on screen after a refusal.
      load();
    } finally {
      setJoining(null);
    }
  };

  if (loading) return <div className="shell"><p className="muted">Loading…</p></div>;

  return (
    <div className="shell">
      <div className="page-head">
        <div>
          <h1>Join a queue</h1>
          <p>Pick the service you need. You can be in one queue at a time.</p>
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {status && (
        <div className="note unread" style={{ marginBottom: '1rem' }}>
          <div>
            <p>
              You are already #{status.position} for {status.service}.
            </p>
            <button type="button" className="btn-quiet" onClick={() => navigate('/status')}>
              View it
            </button>
          </div>
        </div>
      )}

      <div className="grid">
        {services.map((service) => {
          const blocked = !service.isOpen || status !== null;

          return (
            <ServiceCard
              key={service.id}
              service={service}
              waitLabel={service.waiting > 0
                ? `${service.waiting * service.expectedDuration} min`
                : 'no wait'}
              actions={
                <button
                  type="button"
                  className="btn-primary"
                  disabled={blocked || joining === service.id}
                  onClick={() => handleJoin(service.id)}
                >
                  {joining === service.id ? 'Joining…' : 'Join'}
                </button>
              }
            />
          );
        })}
      </div>

      {services.length === 0 && (
        <div className="empty"><p>No services are set up yet.</p></div>
      )}
    </div>
  );
}
