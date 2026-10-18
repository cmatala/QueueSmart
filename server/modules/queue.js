// OWNER: Valeriia
//
// Joining, leaving, reordering, and serving a queue.
//
// Every function returns ok(data) on success or fail(message, status) on
// failure. Import those from ../validation.js.
//
// TODO Valeriia — implement:
//
//   getQueue(serviceId)
//     Entries still waiting, in serving order, each with position (1-based),
//     userName, and wait (use estimateWait from waitTime.js).
//
//   joinQueue(userId, serviceId)
//     Rejects: unknown service, closed service, user already in any queue.
//     Calls notifyJoined(userId, serviceId) after a successful join.
//
//   leaveQueue(entryId)        removes the entry, 404 if not found
//   serveNext(serviceId)       marks the first entry served, 400 if empty.
//                              Calls addHistoryEntry for the served person and
//                              notifyAlmostReady for the new first person.
//   moveEntry(entryId, direction)  'up' or 'down'; rejects moving the first
//                                  entry up or the last one down
//
//   getUserStatus(userId)
//     { service, position, wait, status } for the queue they are in, or null.
//     status is 'almost ready' when position is 1, otherwise 'waiting'.

import { store, findService, findEntry, findUser, waitingFor, nextId, STATUS } from '../data/store.js';
import { ok, fail } from '../validation.js';
import { estimateWait } from './waitTime.js';
import { notifyJoined, notifyAlmostReady } from './notifications.js';
import { addHistoryEntry } from './history.js';

export function getQueue(serviceId) {
  return fail('Not implemented yet.', 501);
}

export function joinQueue(userId, serviceId) {
  return fail('Not implemented yet.', 501);
}

export function leaveQueue(entryId) {
  return fail('Not implemented yet.', 501);
}

export function serveNext(serviceId) {
  return fail('Not implemented yet.', 501);
}

export function moveEntry(entryId, direction) {
  return fail('Not implemented yet.', 501);
}

export function getUserStatus(userId) {
  return fail('Not implemented yet.', 501);
}
