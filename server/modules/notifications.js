// OWNER: Celestin
//
// In-app notifications. A3 requires no real email; a notification is a record
// in the store that the front end displays.
//
// notifyJoined and notifyAlmostReady are called by the queue module, not
// exposed as endpoints. They are side effects: the queue calls them and
// ignores the result, so a missing service can never stop someone joining.

import { store, findService, nextId } from '../data/store.js';
import { ok, fail } from '../validation.js';

/** The current time as 'HH:MM', matching the format used in the store. */
function nowHHMM() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * Adds one unread notification to the front of the list.
 *
 * New ones go at the front so that getNotifications can return the array as
 * it stands and still be newest first.
 */
function add(userId, message) {
  const notification = {
    id: nextId('n'),
    userId,
    message,
    time: nowHHMM(),
    unread: true,
  };

  store.notifications.unshift(notification);
  return ok(notification);
}

/** Someone joined a queue. */
export function notifyJoined(userId, serviceId) {
  const service = findService(serviceId);
  if (!service) return fail('Service not found.', 404);

  return add(userId, `You joined the queue for ${service.name}.`);
}

/** Someone reached the front and should start making their way over. */
export function notifyAlmostReady(userId, serviceId) {
  const service = findService(serviceId);
  if (!service) return fail('Service not found.', 404);

  return add(userId, `You are next for ${service.name}. Please be ready.`);
}

/** One user's notifications, newest first. */
export function getNotifications(userId) {
  const mine = store.notifications
    .filter((n) => n.userId === userId)
    .map(({ id, message, time, unread }) => ({ id, message, time, unread }));

  return ok(mine);
}