// OWNER: Valeriia

import { describe, test, expect, beforeEach } from 'vitest';
import {
  db, resetStore, STATUS, findEntry, waitingFor, insertEntry,
  notificationsFor, historyFor, setServiceOpenRow,
} from '../data/store.js';
import {
  getQueue, joinQueue, leaveQueue, serveNext, moveEntry, getUserStatus,
} from '../modules/queue.js';

beforeEach(()=>{
  resetStore();
});

const names = (result)=>result.data.map((e)=>e.userName);

const positions = (serviceId)=>waitingFor(serviceId).map((e)=>e.position);

describe('getQueue', ()=>{
  test('returns everyone waiting, in serving order', ()=>{
    const result = getQueue('s1');

    expect(result.ok).toBe(true);
    expect(names(result)).toEqual(['Jordan Reyes', 'Alex Rivera', 'Amara Osei', 'Priya Nair']);
  });

  test('numbers positions from 1', ()=>{
    const { data } = getQueue('s1');

    expect(data.map((e)=>e.position)).toEqual([1, 2, 3, 4]);
  });

  test('works out each wait from the position', ()=>{
    const { data } = getQueue('s1');

    expect(data.map((e)=>e.wait)).toEqual([0, 20, 40, 60]);
  });

  test('keeps the A3 response shape', ()=>{
    const [first] = getQueue('s1').data;

    expect(first).toMatchObject({
      id: 'q1', userId: 'u3', serviceId: 's1', joinedAt: '09:05',
      position: 1, status: STATUS.WAITING, userName: 'Jordan Reyes', wait: 0,
    });
    expect(first.queueId).toBeUndefined();
  });

  test('an unknown service returns 404', ()=>{
    expect(getQueue('s99').status).toBe(404);
  });

  test('a service with nobody waiting returns an empty list, not an error', ()=>{
    const result = getQueue('s4');

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

const FREE_USER = 'u1';

describe('joinQueue', ()=>{
  test('puts the user at the back', ()=>{
    const result = joinQueue(FREE_USER, 's1');

    expect(result.ok).toBe(true);
    expect(result.data.position).toBe(5);
    expect(names(getQueue('s1'))).toContain('Celestin Matala');
  });

  test('appends the next position, so the sequence stays clean', ()=>{
    joinQueue(FREE_USER, 's1');

    expect(positions('s1')).toEqual([1, 2, 3, 4, 5]);
  });

  test('after someone leaves, the next joiner fills the end, not the gap', ()=>{
    leaveQueue('q2');
    const result = joinQueue(FREE_USER, 's1');

    expect(result.data.position).toBe(4);
    expect(positions('s1')).toEqual([1, 2, 3, 4]);
  });

  test('creates a notification for them', ()=>{
    joinQueue(FREE_USER, 's1');
    const mine = notificationsFor(FREE_USER);

    expect(mine.some((n)=>n.message.includes('Academic Advising'))).toBe(true);
  });

  test('refuses a second queue while they are still in one', ()=>{
    const result = joinQueue('u3', 's3');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('You are already in a queue.');
  });

  test('the database itself refuses a second live entry', ()=>{
    expect(()=>insertEntry({ id: 'qx', serviceId: 's3', userId: 'u3' })).toThrow();
  });

  test('refuses a closed service', ()=>{
    const result = joinQueue('u5', 's4');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('That queue is closed right now.');
  });

  test('refuses a service closed during the session', ()=>{
    setServiceOpenRow('s3', false);

    expect(joinQueue(FREE_USER, 's3').ok).toBe(false);
  });

  test('an unknown service returns 404', ()=>{
    expect(joinQueue('u5', 's99').status).toBe(404);
  });

  test('an unknown user returns 404', ()=>{
    expect(joinQueue('u99', 's1').status).toBe(404);
  });
});

describe('leaveQueue', ()=>{
  test('removes the entry and everyone behind moves up', ()=>{
    leaveQueue('q1');

    expect(names(getQueue('s1'))).toEqual(['Alex Rivera', 'Amara Osei', 'Priya Nair']);
    expect(findEntry('q1')).toBeUndefined();
  });

  test('leaving from the middle closes the gap', ()=>{
    leaveQueue('q2');

    expect(positions('s1')).toEqual([1, 2, 3]);
    expect(findEntry('q3').position).toBe(2);
  });

  test('records the visit in their history as left', ()=>{
    leaveQueue('q1');

    expect(historyFor('u3')[0]).toMatchObject({ outcome: STATUS.LEFT, serviceName: 'Academic Advising' });
  });

  test('an unknown entry returns 404', ()=>{
    expect(leaveQueue('q99').status).toBe(404);
  });

  test('returns { removed: true }', ()=>{
    expect(leaveQueue('q1').data).toEqual({ removed: true });
  });

  test('an entry that was already served returns 404', ()=>{
    serveNext('s1');

    expect(leaveQueue('q1').status).toBe(404);
  });

  test('the user is no longer in any queue afterwards', ()=>{
    leaveQueue('q2');

    expect(getUserStatus('u2').data).toBeNull();
  });
});

describe('serveNext', ()=>{
  test('serves the person at the front', ()=>{
    const result = serveNext('s1');

    expect(result.ok).toBe(true);
    expect(result.data.userName).toBe('Jordan Reyes');
    expect(result.data.status).toBe(STATUS.SERVED);
  });

  test('leaves the served row in place, marked served', ()=>{
    serveNext('s1');

    expect(findEntry('q1')).toBeDefined();
    expect(findEntry('q1').status).toBe(STATUS.SERVED);
  });

  test('everyone behind moves up and positions stay 1, 2, 3', ()=>{
    serveNext('s1');
    const { data } = getQueue('s1');

    expect(names({ data })).toEqual(['Alex Rivera', 'Amara Osei', 'Priya Nair']);
    expect(positions('s1')).toEqual([1, 2, 3]);
  });

  test('records the visit in their history as served', ()=>{
    serveNext('s1');

    expect(historyFor('u3')[0]).toMatchObject({ outcome: STATUS.SERVED });
  });

  test('tells the new first person they are next', ()=>{
    serveNext('s1');
    const mine = notificationsFor('u2');

    expect(mine.some((n)=>n.message.includes('next for Academic Advising'))).toBe(true);
  });

  test('an empty queue returns 400', ()=>{
    const result = serveNext('s4');

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  test('an unknown service returns 404', ()=>{
    expect(serveNext('s99').status).toBe(404);
  });

  test('serving the last person leaves an empty queue, not an error', ()=>{
    serveNext('s3');

    expect(getQueue('s3').data).toEqual([]);
  });
});

describe('moveEntry', ()=>{
  test('moves an entry up one place', ()=>{
    const result = moveEntry('q2', 'up');

    expect(result.ok).toBe(true);
    expect(names(result)).toEqual(['Alex Rivera', 'Jordan Reyes', 'Amara Osei', 'Priya Nair']);
  });

  test('moves an entry down one place', ()=>{
    const result = moveEntry('q1', 'down');

    expect(names(result)).toEqual(['Alex Rivera', 'Jordan Reyes', 'Amara Osei', 'Priya Nair']);
  });

  test('positions stay a clean sequence after a reorder', ()=>{
    moveEntry('q3', 'up');

    expect(positions('s1')).toEqual([1, 2, 3, 4]);
    expect(findEntry('q3').position).toBe(2);
    expect(findEntry('q2').position).toBe(3);
  });

  test('a reorder, a serve and a leave together still leave 1, 2', ()=>{
    moveEntry('q4', 'up');      
    serveNext('s1');            
    leaveQueue('q4');           

    expect(names(getQueue('s1'))).toEqual(['Alex Rivera', 'Amara Osei']);
    expect(positions('s1')).toEqual([1, 2]);
  });

  test('if the second update fails, the first is rolled back', ()=>{
    db.exec(`
      CREATE TRIGGER fail_q1 BEFORE UPDATE OF position ON QueueEntry
      WHEN OLD.entry_id = 'q1'
      BEGIN SELECT RAISE(ABORT, 'forced failure'); END;`);

    const result = moveEntry('q2', 'up');

    expect(result.ok).toBe(false);
    expect(findEntry('q1').position).toBe(1);
    expect(findEntry('q2').position).toBe(2);     
    expect(positions('s1')).toEqual([1, 2, 3, 4]);
  });

  test('refuses to move the first entry up', ()=>{
    const result = moveEntry('q1', 'up');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('That entry is already first in the queue.');
  });

  test('refuses to move the last entry down', ()=>{
    const result = moveEntry('q4', 'down');

    expect(result.error).toBe('That entry is already last in the queue.');
  });

  test('rejects a direction that is not up or down', ()=>{
    const result = moveEntry('q2', 'sideways');

    expect(result.status).toBe(400);
  });

  test('an unknown entry returns 404', ()=>{
    expect(moveEntry('q99', 'up').status).toBe(404);
  });

  test('moving one queue does not disturb another', ()=>{
    moveEntry('q2', 'up');

    expect(names(getQueue('s2'))).toEqual(['Diego Santos', 'Noor Haddad']);
    expect(positions('s2')).toEqual([1, 2]);
  });
});

describe('getUserStatus', ()=>{
  test('reports the queue, position and wait', ()=>{
    const result = getUserStatus('u2');

    expect(result.data).toMatchObject({
      service: 'Academic Advising',
      position: 2,
      wait: 20,
      status: STATUS.WAITING,
      serviceId: 's1',
      entryId: 'q2',
    });
  });

  test('says almost ready at position 1', ()=>{
    const result = getUserStatus('u3');

    expect(result.data.status).toBe(STATUS.ALMOST_READY);
    expect(result.data.wait).toBe(0);
  });

  test('returns null for someone not in a queue', ()=>{
    const result = getUserStatus('u1');

    expect(result.ok).toBe(true);
    expect(result.data).toBeNull();
  });

  test('follows the user up the queue as people are served', ()=>{
    serveNext('s1');
    const result = getUserStatus('u2');

    expect(result.data.position).toBe(1);
    expect(result.data.status).toBe(STATUS.ALMOST_READY);
  });
});