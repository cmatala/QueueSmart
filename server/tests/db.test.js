// OWNER: Celestin
//
// Tests for the schema itself, rather than for any one module.
//
// Every rule our code checks is also a constraint in schema.sql. These tests
// go round the modules and write straight to the database, which is the only
// way to prove the constraint is really there: a test that goes through a
// module would pass even if the only check were the JavaScript one.

import { describe, test, expect, beforeEach } from 'vitest';
import { db, resetStore } from '../data/store.js';

beforeEach(() => {
  resetStore();
});

// A real bcrypt hash, used where a row needs a valid-looking one.
const HASH = '$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123';

const insert = (sql, ...args) => () => db.prepare(sql).run(...args);

describe('the database is built', () => {
  test('has all seven tables', () => {
    const names = db.prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
    ).all().map((r) => r.name).sort();

    expect(names).toEqual([
      'History', 'Notification', 'Queue', 'QueueEntry',
      'Service', 'UserCredentials', 'UserProfile',
    ]);
  });

  test('foreign keys are switched on', () => {
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
  });

  test('is seeded with the demo data', () => {
    const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;

    expect(count('UserCredentials')).toBe(8);
    expect(count('UserProfile')).toBe(8);
    expect(count('Service')).toBe(4);
    expect(count('Queue')).toBe(4);
    expect(count('QueueEntry')).toBe(7);
  });
});

describe('passwords are never stored in plain text', () => {
  test('every seeded password is a bcrypt hash', () => {
    const rows = db.prepare('SELECT email, password_hash FROM UserCredentials').all();

    for (const row of rows) {
      expect(row.password_hash).toMatch(/^\$2[aby]\$\d{2}\$/);
      expect(row.password_hash).toHaveLength(60);
    }
  });

  test('no stored value equals a demo password', () => {
    const stored = db.prepare('SELECT password_hash FROM UserCredentials').all()
      .map((r) => r.password_hash);

    for (const plain of ['admin123', 'alex1234', 'jordan12']) {
      expect(stored).not.toContain(plain);
    }
  });

  test('the database itself rejects a short value in password_hash', () => {
    expect(insert(
      `INSERT INTO UserCredentials (user_id, email, password_hash)
       VALUES ('zz', 'zz@example.com', 'admin123')`)).toThrow();
  });
});

describe('unique constraints', () => {
  test('two accounts cannot share an email', () => {
    expect(insert(
      `INSERT INTO UserCredentials (user_id, email, password_hash)
       VALUES ('zz', 'alex@queuesmart.edu', ?)`, HASH)).toThrow();
  });

  test('email uniqueness ignores capitals', () => {
    expect(insert(
      `INSERT INTO UserCredentials (user_id, email, password_hash)
       VALUES ('zz', 'ALEX@QueueSmart.edu', ?)`, HASH)).toThrow();
  });

  test('a service cannot have two queues', () => {
    expect(insert(
      `INSERT INTO Queue (queue_id, service_id) VALUES ('qu-extra', 's1')`)).toThrow();
  });

  test('a user cannot be waiting in two queues at once', () => {
    // u2 is already waiting for s1.
    expect(insert(
      `INSERT INTO QueueEntry (entry_id, queue_id, user_id, position)
       VALUES ('zz', 'qu-s3', 'u2', 9)`)).toThrow();
  });

  test('but a user may have many finished entries', () => {
    expect(insert(
      `INSERT INTO QueueEntry (entry_id, queue_id, user_id, position, status)
       VALUES ('zz', 'qu-s3', 'u2', 9, 'served')`)).not.toThrow();
  });
});

describe('check constraints', () => {
  test('role must be user or admin', () => {
    expect(insert(
      `INSERT INTO UserCredentials (user_id, email, password_hash, role)
       VALUES ('zz', 'zz@example.com', ?, 'root')`, HASH)).toThrow();
  });

  test('a service name over 100 characters is rejected', () => {
    expect(insert(
      `INSERT INTO Service (service_id, name, description, expected_duration, priority)
       VALUES ('zz', ?, 'text', 10, 'low')`, 'x'.repeat(101))).toThrow();
  });

  test('a service name of exactly 100 characters is accepted', () => {
    expect(insert(
      `INSERT INTO Service (service_id, name, description, expected_duration, priority)
       VALUES ('zz', ?, 'text', 10, 'low')`, 'x'.repeat(100))).not.toThrow();
  });

  test('duration must be greater than zero', () => {
    expect(insert(
      `INSERT INTO Service (service_id, name, description, expected_duration, priority)
       VALUES ('zz', 'Zed', 'text', 0, 'low')`)).toThrow();
  });

  test('priority must be low, medium or high', () => {
    expect(insert(
      `INSERT INTO Service (service_id, name, description, expected_duration, priority)
       VALUES ('zz', 'Zed', 'text', 10, 'urgent')`)).toThrow();
  });

  test('a queue entry position must be positive', () => {
    expect(insert(
      `INSERT INTO QueueEntry (entry_id, queue_id, user_id, position)
       VALUES ('zz', 'qu-s4', 'u1', 0)`)).toThrow();
  });

  test('a history outcome must be one of the three', () => {
    expect(insert(
      `INSERT INTO History (history_id, user_id, service_id, service_name, outcome)
       VALUES ('zz', 'u2', 's1', 'Academic Advising', 'vanished')`)).toThrow();
  });

  test('a notification status must be sent or viewed', () => {
    expect(insert(
      `INSERT INTO Notification (notification_id, user_id, message, status)
       VALUES ('zz', 'u2', 'Hello', 'maybe')`)).toThrow();
  });
});

describe('foreign keys', () => {
  test('a queue entry for an unknown user is rejected', () => {
    expect(insert(
      `INSERT INTO QueueEntry (entry_id, queue_id, user_id, position)
       VALUES ('zz', 'qu-s4', 'nobody', 1)`)).toThrow();
  });

  test('a queue for an unknown service is rejected', () => {
    expect(insert(
      `INSERT INTO Queue (queue_id, service_id) VALUES ('zz', 'nosuch')`)).toThrow();
  });

  test('a profile without credentials is rejected', () => {
    expect(insert(
      `INSERT INTO UserProfile (user_id, full_name) VALUES ('nobody', 'Ghost')`)).toThrow();
  });
});

describe('deletes cascade the way we want', () => {
  test('deleting a queue removes its entries', () => {
    const before = db.prepare(
      `SELECT COUNT(*) AS n FROM QueueEntry WHERE queue_id = 'qu-s1'`).get().n;
    expect(before).toBe(4);

    db.prepare(`DELETE FROM Queue WHERE queue_id = 'qu-s1'`).run();

    const after = db.prepare(
      `SELECT COUNT(*) AS n FROM QueueEntry WHERE queue_id = 'qu-s1'`).get().n;
    expect(after).toBe(0);
  });

  test('deleting a user removes their profile', () => {
    db.prepare(`DELETE FROM UserCredentials WHERE user_id = 'u8'`).run();

    const profile = db.prepare(
      `SELECT * FROM UserProfile WHERE user_id = 'u8'`).get();
    expect(profile).toBeUndefined();
  });

  test('deleting a service keeps the history, without its link', () => {
    db.prepare(`DELETE FROM Service WHERE service_id = 's2'`).run();

    const row = db.prepare(`SELECT * FROM History WHERE history_id = 'h1'`).get();
    expect(row).toBeDefined();
    expect(row.service_id).toBeNull();
    expect(row.service_name).toBe('Financial Aid');   // the copied name survives
  });
});
