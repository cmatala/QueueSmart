// OWNER: Valeriia

import { useEffect, useState } from 'react'
import { CURRENT_USER_ID } from '../data/mockData'
import { getHistory, getServices } from '../api/client'
import StatusBadge from '../components/StatusBadge'

export default function History(){
  const [userHistory, setUserHistory] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadHistory(){
      try{
        const [historyData, servicesData] = await Promise.all([
          getHistory(CURRENT_USER_ID),
          getServices(),
        ])

        setUserHistory(historyData)
        setServices(servicesData)
        setError('')
      }catch(err){
        setError(err.message)
      }finally{
        setLoading(false)
      }
    }

    loadHistory()
  }, [])

  function formatDate(date){
    if(!date) return 'Date unavailable'

    const parsedDate = new Date(date)

    if(Number.isNaN(parsedDate.getTime())) return date

    return parsedDate.toLocaleString()
  }

  if(loading){
    return(
      <div className="shell">
        <h1>History</h1>
        <p>Loading your history...</p>
      </div>
    )
  }

  if(error){
    return(
      <div className="shell">
        <h1>History</h1>
        <p role="alert">{error}</p>
      </div>
    )
  }

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
            const service = services.find(
              (item) => item.id === visit.serviceId
            )

            return(
              <div className="card" key={visit.id}>
                <div className="card-head">
                  <div>
                    <div className="row-name">
                      {service?.name || 'Unknown service'}
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
