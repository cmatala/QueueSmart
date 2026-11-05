// OWNER: Megan
//
// Tests for services.js — listServices, createService, updateService, setServiceOpen

import { describe, test, expect, beforeEach } from 'vitest';
import { store, resetStore, findService } from '../data/store.js';
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
});

describe('createService', () => {
  test('an admin can create one, and it starts open', () => {
    const result = createService(valid, ADMIN);

    expect(result.ok).toBe(true);
    expect(result.data.name).toBe('Career Services');
    expect(result.data.isOpen).toBe(true);
    expect(result.data.waiting).toBe(0);
    expect(store.services).toHaveLength(5);
  });

  test('a regular user gets 403 and nothing is created', () => {
    const result = createService(valid, REGULAR);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
    expect(store.services).toHaveLength(4);
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