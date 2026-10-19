// OWNER: Megan
//
// Creating, updating, listing services, and opening or closing their queues.
//
// Every function returns ok(data) on success or fail(message, status) on
// failure. Import those from ../validation.js.
//
// TODO Megan - implement:
//
//   listServices()
//     Returns every service with a `waiting` count added, so the screens do
//     not have to work it out. Use waitingFor(serviceId).length.
//
//   createService({ name, description, expectedDuration, priority }, userId)
//     Rejects: empty name, name over 100 characters, empty description,
//              duration that is not a positive whole number,
//              priority not in low/medium/high.
//     Returns 403 if userId is not an administrator.
//
//   updateService(id, fields, userId)   same validation, 404 if not found
//   setServiceOpen(id, isOpen, userId)  opens or closes the queue

import { store, findService, waitingFor, nextId, PRIORITIES } from '../data/store.js';
import { ok, fail, isRequired, maxLength, isPositiveNumber, isOneOf, firstError } from '../validation.js';
import { requireAdmin } from './auth.js';

export const NAME_MAX = 100;

export function listServices() {
  return fail('Not implemented yet.', 501);
}

export function createService(fields = {}, userId) {
  return fail('Not implemented yet.', 501);
}

export function updateService(id, fields = {}, userId) {
  return fail('Not implemented yet.', 501);
}

export function setServiceOpen(id, isOpen, userId) {
  return fail('Not implemented yet.', 501);
}
