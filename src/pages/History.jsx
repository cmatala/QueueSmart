// OWNER: Valeriia

import { useEffect, useState } from 'react';
import { getHistory } from '../api/client';
import StatusBadge from '../components/StatusBadge';

function formatDate(iso){
  const [year, month, day] = String(iso).split('-').map(Number);
  if(!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function History({ account }){
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let cancelled = false;

    getHistory(account.id)
      .then((data)=>!cancelled && setVisits(data))
      .catch((e)=>!cancelled && setError(e.message))
      .finally(()=>!cancelled && setLoading(false));

    return ()=>{ cancelled = true; };
  }, [account.id]);

  if(loading) return <div className="shell"><p className="muted">Loading…</p></div>;

  if(error){
    return(
      <div className="shell">
        <div className="empty"><p role="alert">{error}</p></div>
      </div>
    );
  }

  const served = visits.filter((v)=>v.outcome === 'served');
  const averageWait = served.length
    ? Math.round(served.reduce((sum, v)=>sum + v.waitedMinutes, 0) / served.length)
    : 0;

  return(
    <div className="shell">
      <div className="page-head">
        <div>
          <h1>Your history</h1>
          <p>
            {visits.length} {visits.length === 1 ? 'visit' : 'visits'}
            {served.length > 0 && `, averaging ${averageWait} minutes of waiting`}.
          </p>
        </div>
      </div>

      {visits.length === 0 ? (
        <div className="empty"><p>No visits yet. Join a queue and it will show up here.</p></div>
      ) : (
        <div className="queue-list">
          {visits.map((visit)=>(
            <div key={visit.id} className="queue-row" style={{ gridTemplateColumns: '1fr auto' }}>
              <div>
                <div className="row-name">{visit.serviceName}</div>
                <div className="faint">
                  {formatDate(visit.date)}
                  {visit.waitedMinutes > 0 && ` · waited ${visit.waitedMinutes} min`}
                </div>
              </div>
              <StatusBadge status={visit.outcome} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}