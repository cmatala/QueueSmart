// OWNER: Celestin
//
// Tests for notifications.js — notifyJoined, notifyAlmostReady, getNotifications
//
// See store.test.js for a worked example. The shape of a test is always:
// set up some data, call the function, check the result.
//
// The beforeEach below is REQUIRED. Our data lives in memory, so without it
// one test's changes leak into the next and you get tests that pass alone but
// fail when run together.
//
// The list of tests to write for this module is in the A3 task document.

import { describe, test, expect, beforeEach } from 'vitest';
import { resetStore } from '../data/store.js';
// import { ... } from '../modules/notifications.js';

beforeEach(() => {
  resetStore();
});

describe('notifications', () => {
  test.todo('write the tests listed in the task document');
});
