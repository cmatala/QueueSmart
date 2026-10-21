// OWNER: Megan
// Pick a service, see the estimated wait, join or leave.
// Everything comes from the API: GET /api/services, POST join, DELETE entry.

import ServiceCard from '../components/ServiceCard';
import useQueueData from '../utils/useQueueData';

// TODO: remove this fallback once App.jsx passes the signed-in user as `user`.
const TEMP_USER_ID = 'u2';

export default function JoinQueue({ user }) {
  const userId = user?.id ?? TEMP_USER_ID;
  const { services, loading, error, notice, reload, join, leave, positionIn } = useQueueData(userId);

  return (
    <div className="shell">
      <div className="page-head">
        <div>
          <h1>Join a queue</h1>
          <p>Pick a service and see the wait before you commit.</p>
        </div>
      </div>

      {notice && (
        <p className="hint" role={notice.isError ? 'alert' : 'status'}>
          {notice.text}
        </p>
      )}

      {loading ? (
        <div className="empty">Loading services...</div>
      ) : error ? (
        <div className="empty" role="alert">
          <p style={{ margin: '0 0 .8rem' }}>{error}</p>
          <button type="button" className="btn-primary" onClick={reload}>
            Try again
          </button>
        </div>
      ) : services.length === 0 ? (
        <div className="empty">No services are available right now.</div>
      ) : (
        <div className="stack">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              waiting={service.waiting}
              position={positionIn(service)}
              onJoin={join}
              onLeave={leave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
