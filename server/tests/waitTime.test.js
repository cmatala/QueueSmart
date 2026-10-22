// OWNER: Valeriia

import { describe, test, expect, beforeEach } from 'vitest';
import { resetStore } from '../data/store.js';
import { estimateWait, formatWait } from '../modules/waitTime.js';

beforeEach(()=>{
  resetStore();
});

describe('estimateWait', ()=>{
  test('is people ahead times the expected duration', ()=>{
    expect(estimateWait(3, 's1')).toBe(60);
    expect(estimateWait(1, 's1')).toBe(20);
  });

  test('uses each service own duration', ()=>{
    expect(estimateWait(2, 's2')).toBe(30);   
    expect(estimateWait(2, 's3')).toBe(10);   
  });

  test('the person at the front waits zero', ()=>{
    expect(estimateWait(0, 's1')).toBe(0);
  });

  test('an unknown service returns 0 rather than crashing', ()=>{
    expect(estimateWait(3, 's99')).toBe(0);
    expect(estimateWait(3, undefined)).toBe(0);
  });

  test('nonsense input returns 0', ()=>{
    expect(estimateWait(-2, 's1')).toBe(0);
    expect(estimateWait('many', 's1')).toBe(0);
  });
});

describe('formatWait', ()=>{
  test('zero reads as Next up', ()=>{
    expect(formatWait(0)).toBe('Next up');
  });

  test('under an hour reads in minutes', ()=>{
    expect(formatWait(20)).toBe('20 min');
    expect(formatWait(59)).toBe('59 min');
  });

  test('a whole hour leaves off the minutes', ()=>{
    expect(formatWait(60)).toBe('1 hr');
    expect(formatWait(120)).toBe('2 hr');
  });

  test('over an hour reads as hours and minutes', ()=>{
    expect(formatWait(75)).toBe('1 hr 15 min');
    expect(formatWait(145)).toBe('2 hr 25 min');
  });

  test('negative and nonsense values read as Next up', ()=>{
    expect(formatWait(-10)).toBe('Next up');
    expect(formatWait('soon')).toBe('Next up');
  });
});