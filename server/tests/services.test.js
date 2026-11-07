// OWNER: Megan
//
// Tests for services.js — listServices, createService, updateService, setServiceOpen
//
// A4 additions are at the bottom: the database's own constraints, the Queue
// row that comes with every service, the waiting count, and persistence.

import { describe, test, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { db, resetStore, findService, insertService, setEntryStatus } from '../data/store.js';
import { DB_PATH } from '../db/connection.js';
import { listServices, createService, updateService, setServiceOpen } from '../modules/services.js';

beforeEach(() => {
  resetStore();
});

const ADMIN = 'u1';
const REGULAR = 'u2';

const valid = {
  name: 'Career Services',
  description: 'Resume reviews and mock interviews.',
  expectedDuration: 30,
  priority: 'medium',
};

const countServices = () => db.prepare('SELECT COUNT(*) AS n FROM Service').get().n;

describe('listServices', () => {
  test('returns all four services', () => {
    const result = listServices();

    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(4);
  });

  test('adds a waiting count to each service', () => {
    const { data } = listServices();
    const byId = Object.fromEntries(data.map((s) => [s.id, s]));

    expect(byId.s1.waiting).toBe(4);
    expect(byId.s2.waiting).toBe(2);
    expect(byId.s3.waiting).toBe(1);
    expect(byId.s4.waiting).toBe(0);
  });

  test('keeps the A3 response shape (no queueId leaks out)', () => {
    const { data } = listServices();

    expect(Object.keys(data[0]).sort()).toEqual(
      ['description', 'expectedDuration', 'id', 'isOpen', 'name', 'priority', 'waiting'],
    );
  });
});

describe('createService', () => {
  test('an admin can create one, and it starts open', () => {
    const result = createService(valid, ADMIN);

    expect(result.ok).toBe(true);
    expect(result.data.name).toBe('Career Services');
    expect(result.data.isOpen).toBe(true);
    expect(result.data.waiting).toBe(0);
    expect(countServices()).toBe(5);
  });

  test('a regular user gets 403 and nothing is created', () => {
    const result = createService(valid, REGULAR);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
    expect(countServices()).toBe(4);
  });

  test('rejects an empty name', () => {
    const result = createService({ ...valid, name: '' }, ADMIN);

    expect(result.status).toBe(400);
    expect(result.error).toBe('Service name is required.');
  });

  test('rejects a name of 101 characters', () => {
    const result = createService({ ...valid, name: 'x'.repeat(101) }, ADMIN);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Service name must be 100 characters or fewer.');
  });

  test('accepts a name of exactly 100 characters', () => {
    const result = createService({ ...valid, name: 'x'.repeat(100) }, ADMIN);

    expect(result.ok).toBe(true);
  });

  test('rejects a duration of 0, a negative one, and a fractional one', () => {
    expect(createService({ ...valid, expectedDuration: 0 }, ADMIN).ok).toBe(false);
    expect(createService({ ...valid, expectedDuration: -5 }, ADMIN).ok).toBe(false);
    expect(createService({ ...valid, expectedDuration: 2.5 }, ADMIN).ok).toBe(false);
  });

  test('rejects a priority outside low, medium and high', () => {
    const result = createService({ ...valid, priority: 'urgent' }, ADMIN);

    expect(result.error).toBe('Priority must be one of: low, medium, high.');
  });
});

describe('updateService', () => {
  test('an admin can change the fields', () => {
    const result = updateService('s3', { ...valid, expectedDuration: 45 }, ADMIN);

    expect(result.ok).toBe(true);
    expect(findService('s3').expectedDuration).toBe(45);
    expect(findService('s3').name).toBe('Career Services');
  });

  test('returns the live waiting count', () => {
    const result = updateService('s1', { ...valid, name: 'Advising Plus' }, ADMIN);

    expect(result.data.waiting).toBe(4);
  });

  test('an unknown id returns 404', () => {
    const result = updateService('s99', valid, ADMIN);

    expect(result.status).toBe(404);
    expect(result.error).toBe('Service not found.');
  });

  test('a regular user gets 403 and nothing changes', () => {
    const result = updateService('s3', valid, REGULAR);

    expect(result.status).toBe(403);
    expect(findService('s3').name).toBe('ID Card Services');
  });

  test('the same validation applies as when creating', () => {
    const result = updateService('s3', { ...valid, description: '' }, ADMIN);

    expect(result.status).toBe(400);
  });
});

describe('setServiceOpen', () => {
  test('an admin can close an open queue', () => {
    const result = setServiceOpen('s1', false, ADMIN);

    expect(result.ok).toBe(true);
    expect(findService('s1').isOpen).toBe(false);
  });

  test('an admin can reopen a closed one', () => {
    const result = setServiceOpen('s4', true, ADMIN);

    expect(result.data.isOpen).toBe(true);
  });

  test('closing does not remove the people already waiting', () => {
    setServiceOpen('s1', false, ADMIN);
    const { data } = listServices();

    expect(data.find((s) => s.id === 's1').waiting).toBe(4);
  });

  test('a regular user gets 403', () => {
    expect(setServiceOpen('s1', false, REGULAR).status).toBe(403);
  });

  test('an unknown id returns 404', () => {
    expect(setServiceOpen('s99', false, ADMIN).status).toBe(404);
  });

  test('rejects a value that is not true or false', () => {
    const result = setServiceOpen('s1', 'yes', ADMIN);

    expect(result.status).toBe(400);
  });
});

// ======================================================================
// A4: the database enforces the rules too
// ======================================================================

// Goes straight to the table, skipping services.js and its validation, to
// prove the database refuses bad rows even if our code had a bug.
const insertRaw = (over = {}) =>
  db.prepare(
    `INSERT INTO Service (service_id, name, description, expected_duration, priority)
     VALUES (@id, @name, @description, @duration, @priority)`,
  ).run({ id: 'sx', name: 'Raw', description: 'd', duration: 10, priority: 'low', ...over });

/** Runs fn and returns the SQLite error code it threw, or 'NO_ERROR'. */
const codeOf = (fn) => {
  try {
    fn();
  } catch (err) {
    return err.code;
  }
  return 'NO_ERROR';
};

describe('Service table constraints', () => {
  test('a valid row is accepted', () => {
    expect(codeOf(() => insertRaw())).toBe('NO_ERROR');
  });

  test('a name over 100 characters is rejected by CHECK', () => {
    expect(codeOf(() => insertRaw({ name: 'x'.repeat(101) }))).toBe('SQLITE_CONSTRAINT_CHECK');
  });

  test('a name of exactly 100 characters is accepted', () => {
    expect(codeOf(() => insertRaw({ name: 'x'.repeat(100) }))).toBe('NO_ERROR');
  });

  test('an empty or blank name is rejected by CHECK', () => {
    expect(codeOf(() => insertRaw({ name: '' }))).toBe('SQLITE_CONSTRAINT_CHECK');
    expect(codeOf(() => insertRaw({ name: '   ' }))).toBe('SQLITE_CONSTRAINT_CHECK');
  });

  test('a duration of zero or less is rejected by CHECK', () => {
    expect(codeOf(() => insertRaw({ duration: 0 }))).toBe('SQLITE_CONSTRAINT_CHECK');
    expect(codeOf(() => insertRaw({ duration: -5 }))).toBe('SQLITE_CONSTRAINT_CHECK');
  });

  test('a priority outside low, medium and high is rejected by CHECK', () => {
    expect(codeOf(() => insertRaw({ priority: 'urgent' }))).toBe('SQLITE_CONSTRAINT_CHECK');
  });

  test('a duplicate name is rejected by UNIQUE', () => {
    expect(codeOf(() => insertRaw({ name: 'Financial Aid' }))).toBe('SQLITE_CONSTRAINT_UNIQUE');
  });

  test('a queue for a service that does not exist is rejected by the foreign key', () => {
    const code = codeOf(() =>
      db.prepare(`INSERT INTO Queue (queue_id, service_id) VALUES ('qu-ghost', 'ghost')`).run(),
    );

    expect(code).toBe('SQLITE_CONSTRAINT_FOREIGNKEY');
  });
});

describe('createService and the database', () => {
  test('a duplicate name returns 400 with a clear message, not a crash', () => {
    const result = createService({ ...valid, name: 'Financial Aid' }, ADMIN);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toBe('A service with that name already exists.');
    expect(countServices()).toBe(4);
  });

  test('renaming a service to an existing name returns 400 and changes nothing', () => {
    const result = updateService('s3', { ...valid, name: 'Financial Aid' }, ADMIN);

    expect(result.status).toBe(400);
    expect(findService('s3').name).toBe('ID Card Services');
  });

  test('creating a service also creates its queue, open by default', () => {
    const { data } = createService(valid, ADMIN);
    const queue = db.prepare('SELECT status FROM Queue WHERE service_id = ?').get(data.id);

    expect(queue).toBeDefined();
    expect(queue.status).toBe('open');
  });

  test('each service has exactly one queue', () => {
    const { n } = db
      .prepare(
        `SELECT COUNT(*) AS n FROM Service s
         WHERE (SELECT COUNT(*) FROM Queue q WHERE q.service_id = s.service_id) != 1`,
      )
      .get();

    expect(n).toBe(0);
  });

  test('if the queue row fails, the service row is rolled back too', () => {
    // Plant a queue that already owns the id the new service will want.
    insertRaw({ id: 'zz', name: 'Planted' });
    db.prepare(`INSERT INTO Queue (queue_id, service_id) VALUES ('qu-xyz', 'zz')`).run();
    const before = countServices();

    expect(() =>
      insertService({
        id: 'xyz',
        name: 'Should not survive',
        description: 'd',
        expectedDuration: 10,
        priority: 'low',
      }),
    ).toThrow();

    expect(countServices()).toBe(before);
    expect(db.prepare(`SELECT 1 FROM Service WHERE service_id = 'xyz'`).get()).toBeUndefined();
  });

  test('closing a queue is stored on the Queue row', () => {
    setServiceOpen('s1', false, ADMIN);
    const queue = db.prepare('SELECT status FROM Queue WHERE service_id = ?').get('s1');

    expect(queue.status).toBe('closed');
  });
});

describe('the waiting count', () => {
  test('matches a COUNT run directly against QueueEntry', () => {
    const { data } = listServices();

    for (const service of data) {
      const { n } = db
        .prepare(
          `SELECT COUNT(*) AS n FROM QueueEntry e
           JOIN Queue q ON q.queue_id = e.queue_id
           WHERE q.service_id = ? AND e.status = 'waiting'`,
        )
        .get(service.id);

      expect(service.waiting).toBe(n);
    }
  });

  test('drops when someone is served or leaves', () => {
    setEntryStatus('q1', 'served'); // Jordan, Academic Advising
    setEntryStatus('q2', 'left'); // Alex, Academic Advising

    const advising = listServices().data.find((s) => s.id === 's1');

    expect(advising.waiting).toBe(2);
  });

  test('a brand-new service has none waiting', () => {
    const { data } = createService(valid, ADMIN);

    expect(data.waiting).toBe(0);
  });
});

describe('persistence', () => {
  test('a created service is in the database file, not just in memory', () => {
    const { data } = createService(valid, ADMIN);

    // A second connection reads the file from disk, the way a restarted
    // server would.
    const reopened = new Database(DB_PATH);
    try {
      const row = reopened
        .prepare('SELECT name, expected_duration FROM Service WHERE service_id = ?')
        .get(data.id);
      const queue = reopened.prepare('SELECT status FROM Queue WHERE service_id = ?').get(data.id);

      expect(row.name).toBe('Career Services');
      expect(row.expected_duration).toBe(30);
      expect(queue.status).toBe('open');
    } finally {
      reopened.close();
    }
  });

  test('an update and a close both reach the file', () => {
    updateService('s3', { ...valid, name: 'Renamed Desk', expectedDuration: 12 }, ADMIN);
    setServiceOpen('s3', false, ADMIN);

    const reopened = new Database(DB_PATH);
    try {
      const row = reopened
        .prepare(
          `SELECT s.name, s.expected_duration, q.status FROM Service s
           JOIN Queue q ON q.service_id = s.service_id WHERE s.service_id = 's3'`,
        )
        .get();

      expect(row).toEqual({ name: 'Renamed Desk', expected_duration: 12, status: 'closed' });
    } finally {
      reopened.close();
    }
  });
});