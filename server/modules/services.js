// OWNER: Megan
//
// Creating, updating, listing services, and opening or closing their queues.
//
// Every function returns ok(data) on success or fail(message, status) on
// failure. The route file turns that into an HTTP response.
//
// A4: the data now lives in SQLite. This file holds no SQL; it calls the
// functions in data/store.js, which run the queries. The names, arguments and
// response shapes are the A3 ones, so the route file and the front end are
// untouched.

import {
  allServices,
  insertService,
  updateServiceRow,
  setServiceOpenRow,
  findService,
  nextId,
  PRIORITIES,
} from '../data/store.js';
import { ok, fail, isRequired, maxLength, isPositiveNumber, isOneOf, firstError } from '../validation.js';
import { requireAdmin } from './auth.js';

export const NAME_MAX = 100;

/** Checks the four fields a service needs. Returns a message, or null. */
function checkFields({ name, description, expectedDuration, priority }) {
  return firstError(
    isRequired(name, 'Service name'),
    maxLength(name, NAME_MAX, 'Service name'),
    isRequired(description, 'Description'),
    isPositiveNumber(expectedDuration, 'Expected duration'),
    isOneOf(priority, PRIORITIES, 'Priority'),
  );
}

/**
 * The store also returns queueId, which the A3 API never had. Drop it so the
 * response has exactly the same fields as before.
 */
const toApi = ({ queueId, ...rest }) => rest;

/** One service with its live waiting count, counted by the database. */
const withWaiting = (id) => toApi(allServices().find((s) => s.id === id));

/**
 * Turns a database constraint error into a 400 message.
 * Anything that is not a constraint error is a real bug, so it is rethrown.
 */
function constraintProblem(err) {
  const code = typeof err?.code === 'string' ? err.code : '';
  if (!code.startsWith('SQLITE_CONSTRAINT')) throw err;
  if (code === 'SQLITE_CONSTRAINT_UNIQUE' && /Service\.name/.test(err.message)) {
    return fail('A service with that name already exists.');
  }
  return fail('That service breaks a database rule.');
}

/**
 * Every service, each carrying how many people are waiting for it.
 *
 * The count comes from a COUNT in the database query (see allServices in
 * store.js), not from counting an array here.
 */
export function listServices() {
  return ok(allServices().map(toApi));
}

export function createService(fields = {}, userId) {
  if (!requireAdmin(userId)) {
    return fail('Only an administrator can manage services.', 403);
  }

  const problem = checkFields(fields);
  if (problem) return fail(problem);

  try {
    // insertService writes the Service row and its open Queue row in one
    // transaction, so a service can never exist without its queue.
    const created = insertService({
      id: nextId('s'),
      name: String(fields.name).trim(),
      description: String(fields.description).trim(),
      expectedDuration: Number(fields.expectedDuration),
      priority: fields.priority,
    });
    return ok(withWaiting(created.id));
  } catch (err) {
    return constraintProblem(err);
  }
}

export function updateService(id, fields = {}, userId) {
  if (!requireAdmin(userId)) {
    return fail('Only an administrator can manage services.', 403);
  }

  if (!findService(id)) return fail('Service not found.', 404);

  const problem = checkFields(fields);
  if (problem) return fail(problem);

  try {
    updateServiceRow({
      id,
      name: String(fields.name).trim(),
      description: String(fields.description).trim(),
      expectedDuration: Number(fields.expectedDuration),
      priority: fields.priority,
    });
    return ok(withWaiting(id));
  } catch (err) {
    return constraintProblem(err);
  }
}

/**
 * Opens or closes a service's queue.
 *
 * Closing does not remove the people already waiting; it only stops new
 * people joining. That was the A1 decision.
 */
export function setServiceOpen(id, isOpen, userId) {
  if (!requireAdmin(userId)) {
    return fail('Only an administrator can manage services.', 403);
  }

  if (!findService(id)) return fail('Service not found.', 404);

  if (typeof isOpen !== 'boolean') {
    return fail('isOpen must be true or false.');
  }

  setServiceOpenRow(id, isOpen);
  return ok(withWaiting(id));
}