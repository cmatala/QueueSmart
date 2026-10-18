// OWNER: Celestin
//
// Queue participation history. A visit is recorded when someone is served,
// leaves, or is marked a no-show.
//
// addHistoryEntry is called by Valeriia's queue module. Agree the arguments
// with her before changing them.

import { store, findService, nextId } from '../data/store.js';
import { ok, fail } from '../validation.js';

export function addHistoryEntry({ userId, serviceId, outcome, waitedMinutes } = {}) {
  return fail('Not implemented yet.', 501);
}

export function getHistory(userId) {
  return fail('Not implemented yet.', 501);
}
