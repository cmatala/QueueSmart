// OWNER: Celestin
//
// A worked example of the test pattern, and proof the store resets properly.
// Copy the shape of this file for your own tests.

import { describe, test, expect, beforeEach } from 'vitest';
import { store, resetStore, waitingFor, findService } from '../data/store.js';

// Runs before EVERY test in this file. Our data lives in memory, so without
// this a test that changes the store leaks into the next one.
beforeEach(() => {
  resetStore();
});

describe('the store', () => {
  test('starts with four services', () => {
    expect(store.services).toHaveLength(4);
  });

  test('Academic Advising has four people waiting', () => {
    expect(waitingFor('s1')).toHaveLength(4);
  });

  test('IT Help Desk starts closed', () => {
    expect(findService('s4').isOpen).toBe(false);
  });

  test('a change in one test does not leak into the next', () => {
    store.services.pop();              // break it on purpose
    expect(store.services).toHaveLength(3);
  });

  test('...and the store is back to normal here', () => {
    expect(store.services).toHaveLength(4);   // resetStore put it back
  });
});
