// OWNER: Megan
//
// One service, used on Join Queue and the Admin Dashboard.
//
// The waiting count now arrives on the service itself, as `waiting`, because
// the server works it out in listServices. The screens no longer count
// queue entries themselves, which is what used to let two screens disagree.

export default function ServiceCard({ service, waitLabel, actions }) {
  return (
    <article className="card">
      <div className="card-head">
        <h3>{service.name}</h3>
        <span className={`badge badge-${service.priority}`}>{service.priority}</span>
      </div>

      <p className="muted">{service.description}</p>

      <p className="faint">
        {service.expectedDuration} min per visit
        {typeof service.waiting === 'number' && ` · ${service.waiting} waiting`}
        {waitLabel && ` · about ${waitLabel}`}
      </p>

      <div className="card-head" style={{ marginBottom: 0 }}>
        <span className={`badge ${service.isOpen ? 'badge-open' : 'badge-closed'}`}>
          {service.isOpen ? 'Open' : 'Closed'}
        </span>
        {actions}
      </div>
    </article>
  );
}