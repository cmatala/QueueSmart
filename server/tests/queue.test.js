// OWNER: Valeriia

import { describe, test, expect, beforeEach } from 'vitest';
import { store, resetStore, STATUS, findEntry } from '../data/store.js';
import {
  getQueue, joinQueue, leaveQueue, serveNext, moveEntry, getUserStatus,
} from '../modules/queue.js';
import { setServiceOpen } from '../modules/services.js';

beforeEach(()=>{
  resetStore();
});

const names = (result)=>result.data.map((e)=>e.userName);

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

  test('creates a notification for them', ()=>{
    joinQueue(FREE_USER, 's1');
    const latest = store.notifications[0];

    expect(latest.userId).toBe(FREE_USER);
    expect(latest.message).toContain('Academic Advising');
  });

  test('refuses a second queue while they are still in one', ()=>{
    const result = joinQueue('u3', 's3');   

    expect(result.ok).toBe(false);
    expect(result.error).toBe('You are already in a queue.');
  });

  test('refuses a closed service', ()=>{
    const result = joinQueue('u5', 's4');   

    expect(result.ok).toBe(false);
    expect(result.error).toBe('That queue is closed right now.');
  });

  test('refuses a service closed during the session', ()=>{
    setServiceOpen('s3', false, 'u1');

    expect(joinQueue('u5', 's3').ok).toBe(false);
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

  test('records the visit in their history as left', ()=>{
    leaveQueue('q1');

    expect(store.history[0]).toMatchObject({ userId: 'u3', outcome: STATUS.LEFT });
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
});

describe('serveNext', ()=>{
  test('serves the person at the front', ()=>{
    const result = serveNext('s1');

    expect(result.ok).toBe(true);
    expect(result.data.userName).toBe('Jordan Reyes');
    expect(findEntry('q1').status).toBe(STATUS.SERVED);
  });

  test('everyone behind moves up one position', ()=>{
    serveNext('s1');
    const { data } = getQueue('s1');

    expect(names({ data })).toEqual(['Alex Rivera', 'Amara Osei', 'Priya Nair']);
    expect(data[0].position).toBe(1);
  });

  test('records the visit in their history as served', ()=>{
    serveNext('s1');

    expect(store.history[0]).toMatchObject({ userId: 'u3', outcome: STATUS.SERVED });
  });

  test('tells the new first person they are next', ()=>{
    serveNext('s1');
    const latest = store.notifications[0];

    expect(latest.userId).toBe('u2');          
    expect(latest.message).toContain('next');
  });

  test('an empty queue returns 400', ()=>{
    const result = serveNext('s4');

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
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

    expect(names(getQueue('s2'))).toEqual(['Diego Santos', 'Jordan Reyes']);
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