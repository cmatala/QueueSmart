// OWNER: Valeriia

import { useEffect, useState } from 'react'
import {
  CURRENT_USER_ID,
  notifications,
} from '../data/mockData'
import {
  getQueue,
  leaveQueue as leaveQueueRequest,
  getServices,
  getNotifications,
} from '../api/client'
import StatusBadge from '../components/StatusBadge'
import Notification from '../components/Notification'

export default function QueueStatus(){
  const [queue, setQueue] = useState([])
  const [service, setService] = useState(null)
  const [userNotifications, setUserNotifications] = useState(notifications.filter(
    (notification) => notification.userId === CURRENT_USER_ID
  ))
  const [inQueue, setInQueue] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')


  useEffect(() => {
    async function loadData(){
      try{
        const servicesData = await getServices()

        const queueData = await Promise.all(
          servicesData.map((item) => getQueue(item.id))
        )

        const userQueueIndex = queueData.findIndex((entries) =>
          entries.some((entry) => entry.userId === CURRENT_USER_ID)
        )

        if(userQueueIndex !== -1){
          setQueue(queueData[userQueueIndex])
          setService(servicesData[userQueueIndex])
          setInQueue(true)
        }else{
          setQueue([])
          setService(null)
          setInQueue(false)
        }

        try{
          const notificationData = await getNotifications(CURRENT_USER_ID)
          setUserNotifications(notificationData)
        }catch{
          // Keep the existing mock notifications if this endpoint is unavailable.
        }

        setError('')
      }catch(err){
        setError(err.message)
      }finally{
        setLoading(false)
      }
    }

    loadData()
  }, [])

  async function handleLeaveQueue(){
    const currentEntry = queue.find(
      (entry) => entry.userId === CURRENT_USER_ID
    )

    if(!currentEntry) return

    try{
      await leaveQueueRequest(currentEntry.id)
      setQueue((previousQueue) =>
        previousQueue.filter((entry) => entry.id !== currentEntry.id)
      )
      setInQueue(false)
      setError('')
    }catch(err){
      setError(err.message)
    }
  }

  if(loading){
    return(
      <div className="shell">
        <h1>Your queue status</h1>
        <p>Loading your queue...</p>
      </div>
    )
  }

  if(error && queue.length === 0){
    return(
      <div className="shell">
        <h1>Your queue status</h1>
        <p role="alert">{error}</p>
      </div>
    )
  }

  const currentEntry = queue.find(
    (entry) => entry.userId === CURRENT_USER_ID
  )

  if(!currentEntry || !inQueue){
    return(
      <div className="shell">
        <h1>Your queue status</h1>
        {error && <p role="alert">{error}</p>}
        <div className="empty">
          You are not currently in a queue.
        </div>
      </div>
    )
  }

  const position = currentEntry.position
  const wait = currentEntry.wait
  const positionLabel =
    position === 1
      ? '1st'
      : position === 2
        ? '2nd'
        : position === 3
          ? '3rd'
          : `${position}th`

  return(
    <div className="shell">
      <div className="page-head">
        <div>
          <h1>Your queue status</h1>
          <p>{service?.name || 'Your service'}</p>
        </div>
      </div>

      {error && <p role="alert">{error}</p>}

      <div className="card card-hilite">
        <div className="card-head">
          <div>
            <p className="hint">Your position</p>
            <h2>{positionLabel} in line</h2>
          </div>

          <StatusBadge status={currentEntry.status || 'waiting'} />
        </div>

        <p>
          Estimated wait: {wait === 0 ? 'Next up' : `about ${wait} minutes`}
        </p>

        <p className="hint">
          Joined at {currentEntry.joinedAt} · {currentEntry.priority} priority
        </p>

        <button className="btn-danger" onClick={handleLeaveQueue}>
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
