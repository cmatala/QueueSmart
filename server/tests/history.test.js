// OWNER: Celestin
//
// Tests for history.js — addHistoryEntry, getHistory

import { describe, test, expect, beforeEach } from 'vitest';
import { db, resetStore } from '../data/store.js';
import { addHistoryEntry, getHistory } from '../modules/history.js';

beforeEach(() => {
  resetStore();
});

const visit = {
  userId: 'u2',
  serviceId: 's1',
  outcome: 'served',
  waitedMinutes: 18,
};

const rowCount = () => db.prepare('SELECT COUNT(*) AS n FROM History').get().n;

describe('addHistoryEntry', () => {
  test('writes the visit and returns it', () => {
    const result = addHistoryEntry(visit);

    expect(result.ok).toBe(true);
    expect(result.data.waitedMinutes).toBe(18);
    expect(result.data.serviceName).toBe('Academic Advising');
    expect(rowCount()).toBe(5);
  });

  test('dates it today in local time, not UTC', () => {
    const now = new Date();
    const expected = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    expect(addHistoryEntry(visit).data.date).toBe(expected);
  });

  test('copies the service name in, so it survives the service being deleted', () => {
    const { data } = addHistoryEntry(visit);

    db.prepare(`DELETE FROM Service WHERE service_id = 's1'`).run();

    const after = db.prepare('SELECT * FROM History WHERE history_id = ?').get(data.id);
    expect(after.service_id).toBeNull();
    expect(after.service_name).toBe('Academic Advising');
  });

  test('accepts left and no-show as outcomes', () => {
    expect(addHistoryEntry({ ...visit, outcome: 'left' }).ok).toBe(true);
    expect(addHistoryEntry({ ...visit, outcome: 'no-show' }).ok).toBe(true);
  });

  test('rejects an outcome that is not one of the three', () => {
    const result = addHistoryEntry({ ...visit, outcome: 'vanished' });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(rowCount()).toBe(4);
  });

  test('rejects a missing user or service', () => {
    expect(addHistoryEntry({ ...visit, userId: undefined }).ok).toBe(false);
    expect(addHistoryEntry({ ...visit, serviceId: '' }).ok).toBe(false);
  });

  test('an unknown service returns 404', () => {
    expect(addHistoryEntry({ ...visit, serviceId: 's99' }).status).toBe(404);
  });

  test('an unknown user is refused by the foreign key', () => {
    const result = addHistoryEntry({ ...visit, userId: 'nobody' });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  test('treats a missing or negative wait as zero', () => {
    expect(addHistoryEntry({ ...visit, waitedMinutes: undefined }).data.waitedMinutes).toBe(0);
    expect(addHistoryEntry({ ...visit, waitedMinutes: -4 }).data.waitedMinutes).toBe(0);
  });
});

describe('getHistory', () => {
  test('returns only that user visits', () => {
    const result = getHistory('u2');

    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(4);
  });

  test('names the service on every row', () => {
    const { data } = getHistory('u2');

    expect(data[0].serviceName).toBe('Financial Aid');
  });

  test('returns them newest first', () => {
    const { data } = getHistory('u2');
    const dates = data.map((h) => h.date);

    expect(dates).toEqual([...dates].sort().reverse());
  });

  test('a new visit appears at the top', () => {
    addHistoryEntry({ ...visit, serviceId: 's3' });
    const { data } = getHistory('u2');

    expect(data[0].serviceName).toBe('ID Card Services');
    expect(data).toHaveLength(5);
  });

  test('a user with no visits gets an empty list', () => {
    expect(getHistory('u6').data).toEqual([]);
  });
});

describe('persistence', () => {
  test('a visit written now is still there after reopening the database', async () => {
    const { data } = addHistoryEntry({ ...visit, serviceId: 's3' });

    // Open a second, independent connection to the same file. This is as
    // close as a unit test gets to restarting the server, and it is the one
    // thing A3 could not do at all.
    const { default: Database } = await import('better-sqlite3');
    const { DB_PATH } = await import('../db/connection.js');
    const fresh = new Database(DB_PATH, { readonly: true });

    const row = fresh.prepare('SELECT * FROM History WHERE history_id = ?').get(data.id);
    fresh.close();

    expect(row).toBeDefined();
    expect(row.service_name).toBe('ID Card Services');
  });
});
