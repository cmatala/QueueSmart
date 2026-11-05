// OWNER: Celestin
//
// Tests for notifications.js — notifyJoined, notifyAlmostReady, getNotifications

import { describe, test, expect, beforeEach } from 'vitest';
import { db, resetStore, notificationsFor } from '../data/store.js';
import { notifyJoined, notifyAlmostReady, getNotifications } from '../modules/notifications.js';

beforeEach(() => {
  resetStore();
});

const countFor = (userId) =>
  db.prepare('SELECT COUNT(*) AS n FROM Notification WHERE user_id = ?').get(userId).n;

describe('notifyJoined', () => {
  test('writes a row and returns it unread', () => {
    const result = notifyJoined('u1', 's1');

    expect(result.ok).toBe(true);
    expect(result.data.unread).toBe(true);
    expect(result.data.message).toBe('You joined the queue for Academic Advising.');
    expect(countFor('u1')).toBe(1);
  });

  test('an unknown service fails and writes nothing', () => {
    const result = notifyJoined('u1', 's99');

    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(countFor('u1')).toBe(0);
  });

  test('an unknown user is refused by the foreign key, not by a crash', () => {
    const result = notifyJoined('nobody', 's1');

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });
});

describe('notifyAlmostReady', () => {
  test('tells the user they are next', () => {
    const result = notifyAlmostReady('u2', 's2');

    expect(result.data.message).toBe('You are next for Financial Aid. Please be ready.');
  });

  test('an unknown service fails', () => {
    expect(notifyAlmostReady('u2', 's99').status).toBe(404);
  });
});

describe('getNotifications', () => {
  test('returns only that user rows', () => {
    const result = getNotifications('u2');

    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(3);
  });

  test('returns them newest first', () => {
    notifyJoined('u2', 's3');
    const { data } = getNotifications('u2');

    expect(data[0].message).toContain('ID Card Services');
    expect(data).toHaveLength(4);
  });

  test('reports which were unread at the moment they were asked for', () => {
    const { data } = getNotifications('u2');

    expect(data.filter((n) => n.unread)).toHaveLength(2);
  });

  test('reading them moves the rows from sent to viewed', () => {
    getNotifications('u2');

    const statuses = notificationsFor('u2').map((n) => n.status);
    expect(statuses.every((s) => s === 'viewed')).toBe(true);
  });

  test('so a second read shows nothing unread', () => {
    getNotifications('u2');
    const { data } = getNotifications('u2');

    expect(data.filter((n) => n.unread)).toHaveLength(0);
  });

  test('viewing one user notifications does not touch another user', () => {
    notifyJoined('u1', 's1');
    getNotifications('u2');

    expect(notificationsFor('u1')[0].status).toBe('sent');
  });

  test('a user with none gets an empty list, not an error', () => {
    const result = getNotifications('u6');

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});
