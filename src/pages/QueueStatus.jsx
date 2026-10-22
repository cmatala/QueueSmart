// OWNER: Valeriia

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserStatus, getQueue, leaveQueue } from '../api/client';
import { formatWait } from '../utils/formatWait';
import StatusBadge from '../components/StatusBadge';

export default function QueueStatus({ account }){
  const navigate = useNavigate();

  const [status, setStatus] = useState(null);
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  const load = useCallback(async()=>{
    try{
      const statusData = await getUserStatus(account.id);
      setStatus(statusData);
      setQueue(statusData ? await getQueue(statusData.serviceId) : []);
      setError('');
    }
    catch(e){
      setError(e.message);
    }
    finally{
      setLoading(false);
    }
  }, [account.id]);

  useEffect(()=>{ load(); }, [load]);

  const handleLeave = async()=>{
    if(!status) return;
    setLeaving(true);
    try{
      await leaveQueue(status.entryId);
      navigate('/dashboard');
    }
    catch(e){
      setError(e.message);
      setLeaving(false);
    }
  };

  if(loading) return <div className="shell"><p className="muted">Loading…</p></div>;

  if(error){
    return(
      <div className="shell">
        <div className="empty">
          <p role="alert">{error}</p>
          <button type="button" onClick={load}>Try again</button>
        </div>
      </div>
    );
  }

  if(!status){
    return(
      <div className="shell">
        <div className="page-head"><h1>Queue status</h1></div>
        <div className="empty">
          <p>You are not in a queue.</p>
          <button type="button" className="btn-primary" onClick={()=>navigate('/join')}>
            Join one
          </button>
        </div>
      </div>
    );
  }

  return(
    <div className="shell">
      <div className="page-head">
        <div>
          <h1>{status.service}</h1>
          <p>
            You are number {status.position} of {queue.length}.
          </p>
        </div>
        <div className="btn-row">
          <button type="button" onClick={load}>Refresh</button>
          <button type="button" className="btn-danger" onClick={handleLeave} disabled={leaving}>
            {leaving ? 'Leaving…' : 'Leave queue'}
          </button>
        </div>
      </div>

      <div className="split">
        <section className="stack">
          <h2>Everyone waiting</h2>
          <div className="queue-list">
            {queue.map((entry)=>(
              <div
                key={entry.id}
                className={`queue-row${entry.position === 1 ? ' is-next' : ''}`}
              >
                <span className="pos">{entry.position}</span>
                <div>
                  <div className="row-name">
                    {entry.userId === account.id ? 'You' : entry.userName}
                  </div>
                  <div className="faint">joined {entry.joinedAt}</div>
                </div>
                <span className="badge badge-waiting">{formatWait(entry.wait)}</span>
              </div>
            ))}
          </div>
        </section>

        <aside>
          <section className="card">
            <div className="card-head">
              <h2>Your wait</h2>
              <StatusBadge status={status.status} />
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 .25rem' }}>
              {formatWait(status.wait)}
            </p>
            <p className="faint">
              {status.status === 'almost ready'
                ? 'You are next. Please make your way over.'
                : `${status.position - 1} ahead of you.`}
            </p>
            <p className="hint">
              Estimated from the number of people ahead and how long this
              service usually takes. It is a guide, not a promise.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}