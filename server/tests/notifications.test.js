// OWNER: Celestin
//
// Tests for notifications.js — notifyJoined, notifyAlmostReady, getNotifications

import { describe, test, expect, beforeEach } from 'vitest';
import { store, resetStore } from '../data/store.js';
import { notifyJoined, notifyAlmostReady, getNotifications } from '../modules/notifications.js';

beforeEach(() => {
  resetStore();
});

describe('notifyJoined', () => {
  test('adds an unread notification naming the service', () => {
    const result = notifyJoined('u5', 's1');

    expect(result.ok).toBe(true);
    expect(result.data.unread).toBe(true);
    expect(result.data.message).toBe('You joined the queue for Academic Advising.');
  });

  test('puts the newest one at the front', () => {
    notifyJoined('u5', 's1');

    expect(store.notifications[0].userId).toBe('u5');
    expect(store.notifications).toHaveLength(4);
  });

  test('an unknown service fails instead of writing a broken message', () => {
    const result = notifyJoined('u5', 's99');

    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(store.notifications).toHaveLength(3);
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
  test('returns only that user notifications', () => {
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

  test('keeps the unread flag so the screen can show a badge', () => {
    const { data } = getNotifications('u2');

    expect(data.filter((n) => n.unread)).toHaveLength(2);
  });

  test('a user with none gets an empty list, not an error', () => {
    const result = getNotifications('u6');

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});