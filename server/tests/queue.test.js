// OWNER: Valeriia

import { describe, test, expect, beforeEach } from 'vitest';
import { store, resetStore, STATUS } from '../data/store.js';
import {
  getQueue,
  joinQueue,
  leaveQueue,
  serveNext,
  moveEntry,
  getUserStatus,
} from '../modules/queue.js';

beforeEach(() => {
  resetStore();
});

describe('queue', () => {
  test('gets queue entries in serving order with positions and wait times', () => {
    const result = getQueue('s1');

    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(4);
    expect(result.data[0].id).toBe('q1');
    expect(result.data[0].position).toBe(1);
    expect(result.data[0].userName).toBe('Jordan Reyes');
    expect(result.data[1].wait).toBe(20);
  });

  test('rejects joining a closed service', () => {
    const result = joinQueue('u2', 's4');

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  test('adds a user to the end of an open queue', () => {
    const result = joinQueue('u1', 's3');

    expect(result.ok).toBe(true);
    expect(result.data.userId).toBe('u1');
    expect(store.queueEntries.at(-1).userId).toBe('u1');
  });

  test('rejects a user already waiting in another queue', () => {
    const result = joinQueue('u3', 's3');

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  test('removes a waiting entry', () => {
    const result = leaveQueue('q1');

    expect(result.ok).toBe(true);
    expect(result.data.removed).toBe(true);
    expect(store.queueEntries.some((entry) => entry.id === 'q1')).toBe(false);
  });

  test('serves the first entry in a queue', () => {
    const result = serveNext('s1');

    expect(result.ok).toBe(true);
    expect(result.data.id).toBe('q1');
    expect(result.data.status).toBe(STATUS.SERVED);
  });

  test('rejects serving an empty queue', () => {
    store.queueEntries = store.queueEntries.filter(
      (entry) => entry.serviceId !== 's1'
    );

    const result = serveNext('s1');

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  test('moves an entry up one position', () => {
    const result = moveEntry('q2', 'up');

    expect(result.ok).toBe(true);

    const queue = store.queueEntries.filter(
      (entry) => entry.serviceId === 's1' && entry.status === STATUS.WAITING
    );

    expect(queue[0].id).toBe('q2');
    expect(queue[1].id).toBe('q1');
  });

  test('does not move the first entry up', () => {
    const result = moveEntry('q1', 'up');

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  test('gets the current status of a user in a queue', () => {
    const result = getUserStatus('u3');

    expect(result.ok).toBe(true);
    expect(result.data.position).toBe(1);
    expect(result.data.wait).toBe(0);
    expect(result.data.status).toBe(STATUS.ALMOST_READY);
  });

  test('returns null when a user is not waiting', () => {
    const result = getUserStatus('u1');

    expect(result.ok).toBe(true);
    expect(result.data).toBeNull();
  });
});

