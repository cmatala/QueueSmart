// OWNER: Celestin
//
// In-app notifications, now stored in the Notification table.
//
// A4 adds a status column: a notification is 'sent' until the user looks at
// it, then 'viewed'. The API keeps the A3 shape, with `unread` as the boolean
// the screens already read, so nothing on the front end changed.
//
// notifyJoined and notifyAlmostReady are called by the queue module and their
// result is ignored, exactly as in A3.

import {
  findService, nextId,
  insertNotification, notificationsFor, markAllNotificationsViewed,
} from '../data/store.js';
import { ok, fail } from '../validation.js';

/** Database row -> the shape the front end has always received. */
const forScreen = ({ id, message, time, status }) => ({
  id, message, time, unread: status === 'sent',
});

function add(userId, message) {
  try {
    return ok(forScreen(insertNotification({ id: nextId('n'), userId, message })));
  } catch (error) {
    // The foreign key on user_id rejects a notification for someone who does
    // not exist. Report it rather than letting the constraint error escape.
    return fail('Could not create that notification.', 400);
  }
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

/**
 * One user's notifications, newest first.
 *
 * Reading them is what marks them viewed, which is why the rows are mapped
 * before the update runs: the caller still sees which ones were unread at the
 * moment they asked, and the next call will show them all as read. That is
 * the sent -> viewed transition A4 asks for, with no new endpoint.
 */
export function getNotifications(userId) {
  const mine = notificationsFor(userId).map(forScreen);
  markAllNotificationsViewed(userId);
  return ok(mine);
}
