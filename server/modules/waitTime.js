// OWNER: Valeriia
//
// Wait-time estimation. This is the A1 decision, unchanged:
// people ahead x the service's expected duration.
//
// These two return plain values, not ok()/fail(), because they are pure
// calculations that other modules call.
//
// TODO Valeriia — implement:
//
//   estimateWait(peopleAhead, serviceId) -> minutes
//     Returns 0 for an unknown service rather than crashing.
//
//   formatWait(minutes) -> 'Next up' | '20 min' | '1 hr 15 min'

import { findService } from '../data/store.js';

export function estimateWait(peopleAhead, serviceId) {
  return 0;
}

export function formatWait(minutes) {
  return '';
}
