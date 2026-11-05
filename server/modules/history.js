// OWNER: Celestin
//
// Queue participation history, now stored in the History table.
//
// A visit is recorded when someone is served, leaves, or is marked a no-show.
// addHistoryEntry is called by the queue module as a side effect, the same way
// notifications are.

import {
  findService, nextId, insertHistory, historyFor, OUTCOMES,
} from '../data/store.js';
import { ok, fail, isRequired, isOneOf, firstError } from '../validation.js';

export { OUTCOMES };

/**
 * Records one finished visit.
 *
 * The service's name is copied into the row rather than only its id. A past
 * visit should still say what it was for even if the service is deleted
 * later, and the schema's ON DELETE SET NULL on service_id is what makes that
 * necessary.
 *
 * The date comes from the database's own date('now','localtime'), which also
 * settles the A2 bug where toISOString() filed an evening visit under
 * tomorrow for anyone behind UTC.
 */
export function addHistoryEntry({ userId, serviceId, outcome, waitedMinutes } = {}) {
  const problem = firstError(
    isRequired(userId, 'User'),
    isRequired(serviceId, 'Service'),
    isOneOf(outcome, OUTCOMES, 'Outcome'),
  );
  if (problem) return fail(problem);

  const service = findService(serviceId);
  if (!service) return fail('Service not found.', 404);

  const minutes = Number(waitedMinutes);

  try {
    return ok(insertHistory({
      id: nextId('h'),
      userId,
      serviceId,
      serviceName: service.name,
      outcome,
      waitedMinutes: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0,
    }));
  } catch {
    // user_id has a foreign key; an unknown user lands here.
    return fail('Could not record that visit.', 400);
  }
}

/**
 * One user's past visits, newest first.
 *
 * Ordering and the service name both come from the query, so this function
 * only has to hand the rows on.
 */
export function getHistory(userId) {
  return ok(historyFor(userId).map(({ id, serviceId, serviceName, date, outcome, waitedMinutes }) =>
    ({ id, serviceId, serviceName, date, outcome, waitedMinutes })));
}
