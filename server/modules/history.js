// OWNER: Celestin
//
// Queue participation history. A visit is recorded when someone is served,
// leaves, or is marked a no-show.
//
// addHistoryEntry is called by the queue module as a side effect, the same
// way notifications are.

import { store, findService, nextId, STATUS } from '../data/store.js';
import { ok, fail, isRequired, isOneOf, firstError } from '../validation.js';

export const OUTCOMES = [STATUS.SERVED, STATUS.LEFT, STATUS.NO_SHOW];

/** Today as 'YYYY-MM-DD' in local time. */
function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Records one finished visit.
 *
 * Built from local date parts rather than toISOString(), which converts to
 * UTC and files an evening visit under tomorrow's date for anyone in a
 * negative offset. We hit exactly that bug on the A2 History screen.
 */
export function addHistoryEntry({ userId, serviceId, outcome, waitedMinutes } = {}) {
  const problem = firstError(
    isRequired(userId, 'User'),
    isRequired(serviceId, 'Service'),
    isOneOf(outcome, OUTCOMES, 'Outcome'),
  );
  if (problem) return fail(problem);

  const minutes = Number(waitedMinutes);

  const entry = {
    id: nextId('h'),
    userId,
    serviceId,
    date: today(),
    outcome,
    waitedMinutes: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0,
  };

  store.history.unshift(entry);
  return ok(entry);
}

/**
 * One user's past visits, newest first.
 *
 * The service name is resolved here so the History screen does not have to
 * fetch the service list just to render a row.
 */
export function getHistory(userId) {
  const mine = store.history
    .filter((h) => h.userId === userId)
    .map((h) => ({
      id: h.id,
      serviceId: h.serviceId,
      serviceName: findService(h.serviceId)?.name ?? 'Unknown service',
      date: h.date,
      outcome: h.outcome,
      waitedMinutes: h.waitedMinutes,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return ok(mine);
}