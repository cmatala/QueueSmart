// OWNER: Celestin
// Service list, queue lengths, open/close actions.

import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { getQueue } from '../data/mockData';

export default function AdminDashboard({ services, setServices, entries }) {
  const navigate = useNavigate();

  const toggleOpen = (serviceId) => {
    setServices(
      services.map((s) => (s.id === serviceId ? { ...s, isOpen: !s.isOpen } : s)),
    );
  };

  const totalWaiting = services.reduce(
    (sum, s) => sum + getQueue(entries, s.id).length,
    0,
  );
  const openCount = services.filter((s) => s.isOpen).length;

  return (
    <div className="shell">
      <div className="page-head">
        <div>
          <h1>Service overview</h1>
          <p>
            {totalWaiting} {totalWaiting === 1 ? 'person' : 'people'} waiting across{' '}
            {openCount} open {openCount === 1 ? 'service' : 'services'}.
          </p>
        </div>
        <div className="btn-row">
          <button type="button" onClick={() => navigate('/admin/services')}>
            Manage services
          </button>
          <button type="button" className="btn-primary" onClick={() => navigate('/admin/queues')}>
            Manage queues
          </button>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="empty">
          <p style={{ margin: '0 0 .8rem' }}>No services yet.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/admin/services')}>
            Create the first one
          </button>
        </div>
      ) : (
        <div className="grid">
          {services.map((service) => {
            const waiting = getQueue(entries, service.id).length;
            return (
              <article className="card" key={service.id}>
                <div className="card-head">
                  <h3>{service.name}</h3>
                  <StatusBadge value={service.priority} />
                </div>

                <p className="faint" style={{ margin: '0 0 .4rem' }}>
                  {service.expectedDuration} min per visit
                </p>

                <div style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.2 }}>
                  {waiting} waiting
                </div>

                <div className="card-head" style={{ marginTop: '.8rem', marginBottom: 0 }}>
                  <StatusBadge value={service.isOpen ? 'open' : 'closed'} />
                  <div className="btn-row">
                    <button
                      type="button"
                      className={service.isOpen ? 'btn-danger' : 'btn-primary'}
                      onClick={() => toggleOpen(service.id)}
                    >
                      {service.isOpen ? 'Close queue' : 'Open queue'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}