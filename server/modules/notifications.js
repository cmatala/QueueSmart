// OWNER: Celestin
//
// In-app notifications. A3 requires no real email; a notification is a record
// in the store that the front end displays.
//
// notifyJoined and notifyAlmostReady are called by Valeriia's queue module,
// not exposed as endpoints. Agree the arguments with her before changing them.

import { store, findService, nextId } from '../data/store.js';
import { ok, fail } from '../validation.js';

export function notifyJoined(userId, serviceId) {
  return fail('Not implemented yet.', 501);
}

export function notifyAlmostReady(userId, serviceId) {
  return fail('Not implemented yet.', 501);
}

export function getNotifications(userId) {
  return fail('Not implemented yet.', 501);
}
