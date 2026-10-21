// OWNER: Megan
//
// Tests for services.js - listServices, createService, updateService, setServiceOpen
//
// See store.test.js for a worked example. The shape of a test is always:
// set up some data, call the function, check the result.
//
// The beforeEach below is REQUIRED. Our data lives in memory, so without it
// one test's changes leak into the next and you get tests that pass alone but
// fail when run together.
//
// The list of tests to write for this module is in the A3 task document.
//
// Tests for services.js - listServices, createService, updateService, setServiceOpen

import { describe, test, expect, beforeEach } from 'vitest';
import { store, resetStore, findService } from '../data/store.js';
import {
  listServices,
  createService,
  updateService,
  setServiceOpen,
} from '../modules/services.js';

beforeEach(() => {
  resetStore();
});

// Assumes store.users holds users with a role of 'admin' or 'user'.
const adminId = () => store.users.find((u) => u.role === 'admin').id;
const userId = () => store.users.find((u) => u.role === 'user').id;

const valid = {
  name: 'Tutoring',
  description: 'Peer tutoring sessions',
  expectedDuration: 25,
  priority: 'medium',
};

describe('services', () => {
  test('lists all four services, each with a waiting count', () => {
    const result = listServices();

    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(4);
    expect(result.data.every((s) => typeof s.waiting === 'number')).toBe(true);
    expect(result.data.find((s) => s.id === 's1').waiting).toBe(4);
  });

  test('an administrator can create a service, and it is open with an id', () => {
    const result = createService(valid, adminId());

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ name: 'Tutoring', isOpen: true, waiting: 0 });
    expect(findService(result.data.id)).toBeTruthy();
    expect(listServices().data).toHaveLength(5);
  });

  test('rejects an empty name and a 101-character name', () => {
    const empty = createService({ ...valid, name: '' }, adminId());
    const tooLong = createService({ ...valid, name: 'a'.repeat(101) }, adminId());
    const exactly100 = createService({ ...valid, name: 'a'.repeat(100) }, adminId());

    expect(empty.ok).toBe(false);
    expect(empty.status).toBe(400);
    expect(empty.error).toBe('Service name is required.');
    expect(tooLong.ok).toBe(false);
    expect(tooLong.status).toBe(400);
    expect(exactly100.ok).toBe(true);
  });

  test('rejects a duration of 0, -5 or a decimal', () => {
    for (const expectedDuration of [0, -5, 2.5]) {
      const result = createService({ ...valid, expectedDuration }, adminId());
      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
    }
  });

  test('rejects an empty description and a priority that is not low, medium or high', () => {
    const noDescription = createService({ ...valid, description: '' }, adminId());
    const badPriority = createService({ ...valid, priority: 'urgent' }, adminId());

    expect(noDescription.ok).toBe(false);
    expect(noDescription.status).toBe(400);
    expect(badPriority.ok).toBe(false);
    expect(badPriority.status).toBe(400);
  });

  test('returns 403 when a non-administrator creates, updates or opens a service', () => {
    const created = createService(valid, userId());
    const updated = updateService('s1', valid, userId());
    const toggled = setServiceOpen('s1', false, userId());

    expect(created.status).toBe(403);
    expect(updated.status).toBe(403);
    expect(toggled.status).toBe(403);
    expect(listServices().data).toHaveLength(4);
  });

  test('updates a service, opens and closes its queue, and returns 404 for an unknown id', () => {
    const updated = updateService('s1', { ...valid, name: 'Advising Plus' }, adminId());
    const closed = setServiceOpen('s1', false, adminId());
    const reopened = setServiceOpen('s4', true, adminId());

    expect(updated.ok).toBe(true);
    expect(updated.data.name).toBe('Advising Plus');
    expect(closed.data.isOpen).toBe(false);
    expect(reopened.data.isOpen).toBe(true);
    expect(updateService('nope', valid, adminId()).status).toBe(404);
    expect(setServiceOpen('nope', true, adminId()).status).toBe(404);
  });
});