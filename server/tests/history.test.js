// OWNER: Celestin
//
// Tests for history.js — addHistoryEntry, getHistory

import { describe, test, expect, beforeEach } from 'vitest';
import { store, resetStore, STATUS } from '../data/store.js';
import { addHistoryEntry, getHistory } from '../modules/history.js';

beforeEach(() => {
  resetStore();
});

const visit = {
  userId: 'u2',
  serviceId: 's1',
  outcome: STATUS.SERVED,
  waitedMinutes: 18,
};

describe('addHistoryEntry', () => {
  test('records a visit and puts it at the front', () => {
    const result = addHistoryEntry(visit);

    expect(result.ok).toBe(true);
    expect(result.data.waitedMinutes).toBe(18);
    expect(store.history[0].id).toBe(result.data.id);
    expect(store.history).toHaveLength(5);
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

  test('accepts left and no-show as outcomes', () => {
    expect(addHistoryEntry({ ...visit, outcome: STATUS.LEFT }).ok).toBe(true);
    expect(addHistoryEntry({ ...visit, outcome: STATUS.NO_SHOW }).ok).toBe(true);
  });

  test('rejects an outcome that is not one of the three', () => {
    const result = addHistoryEntry({ ...visit, outcome: 'vanished' });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  test('rejects a missing user or service', () => {
    expect(addHistoryEntry({ ...visit, userId: undefined }).ok).toBe(false);
    expect(addHistoryEntry({ ...visit, serviceId: '' }).ok).toBe(false);
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

  test('resolves the service name for each row', () => {
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
