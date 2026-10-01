// OWNER: Valeriia
// TODO: see the A2 plan for what this screen must do.

import{
  CURRENT_USER_ID,
  history,
  getService,
  formatDate,
} from '../data/mockData'
import StatusBadge from '../components/StatusBadge'

export default function History(){
  const userHistory = history.filter((visit) => visit.userId === CURRENT_USER_ID)

  return(
    <div className="shell">
      <div className="page-head">
        <div>
          <h1>History</h1>
          <p>Your previous queue visits</p>
        </div>
      </div>

      {userHistory.length === 0 ? (
        <div className="empty">
          You do not have any previous visits.
        </div>
      ) : (
        <div className="stack">
          {userHistory.map((visit) => {
            const service = getService(visit.serviceId)

            return(
              <div className="card" key={visit.id}>
                <div className="card-head">
                  <div>
                    <div className="row-name">
                      {service.name}
                    </div>

                    <div className="hint">
                      {formatDate(visit.date)}
                    </div>
                  </div>

                  <StatusBadge status={visit.outcome} />
                </div>

                <div className="hint">
                  {visit.outcome === 'no-show'
                    ? 'No wait'
                    : `${visit.waitedMinutes} min`}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
