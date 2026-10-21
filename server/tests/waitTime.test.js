// OWNER: Valeriia

import { describe, test, expect, beforeEach } from 'vitest';
import { resetStore } from '../data/store.js';
import { estimateWait, formatWait } from '../modules/waitTime.js';

beforeEach(() => {
  resetStore();
});

describe('waitTime', () => {
  test('calculates estimated wait using service duration', () => {
    expect(estimateWait(3, 's1')).toBe(60);
  });

  test('returns zero for an unknown service', () => {
    expect(estimateWait(3, 'unknown')).toBe(0);
  });

  test('formats zero minutes as Next up', () => {
    expect(formatWait(0)).toBe('Next up');
  });

  test('formats minutes under one hour', () => {
    expect(formatWait(20)).toBe('20 min');
  });

  test('formats whole hours', () => {
    expect(formatWait(60)).toBe('1 hr');
  });

  test('formats hours and remaining minutes', () => {
    expect(formatWait(75)).toBe('1 hr 15 min');
  });
});
