// OWNER: Valeriia
// TODO: see the A2 plan for what this screen must do.

import { useState } from 'react'
import{
  CURRENT_USER_ID,
  queueEntries,
  notifications,
  getService,
  getQueue,
  estimateWait,
} from '../data/mockData'
import StatusBadge from '../components/StatusBadge'
import Notification from '../components/Notification'

export default function QueueStatus(){
  const [inQueue, setInQueue] = useState(true)

  const currentEntry = queueEntries.find((entry) => entry.userId === CURRENT_USER_ID)

  if(!currentEntry || !inQueue){
    return(
      <div className="shell">
        <h1>Your queue status</h1>
        <div className="empty">
          You are not currently in a queue.
        </div>
      </div>
    )
  }

  const service = getService(currentEntry.serviceId)
  const queue = getQueue(queueEntries, currentEntry.serviceId)
  const position = queue.findIndex((entry) => entry.id === currentEntry.id) + 1

  const peopleAhead = position - 1
  const wait = estimateWait(peopleAhead, currentEntry.serviceId)

  const userNotifications = notifications.filter((notification) => notification.userId === CURRENT_USER_ID)

  return(
    <div className="shell">
      <div className="page-head">
        <div>
          <h1>Your queue status</h1>
          <p>{service.name}</p>
        </div>
      </div>

      <div className="card card-hilite">
        <div className="card-head">
          <div>
            <p className="hint">Your position</p>
            <h2>
              {position === 1
                ? '1st'
                : position === 2
                  ? '2nd'
                  : position === 3
                    ? '3rd'
                    : `${position}th`} in line
            </h2>
          </div>

          <StatusBadge status={currentEntry.status} />
        </div>

        <p>
          Estimated wait: about {wait} minutes
        </p>

        <p className="hint">
          Joined at {currentEntry.joinedAt} · {currentEntry.priority} priority
        </p>

        <button
          className="btn-danger"
          onClick={() => setInQueue(false)}
        >
          Leave queue
        </button>
      </div>

      <div className="stack">
        <h2 style={{ marginTop: '20px' }}>Updates</h2>

        {userNotifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            time={notification.time}
            unread={notification.unread}
          />
        ))}
      </div>
    </div>
  )
}


