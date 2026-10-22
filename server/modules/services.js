// OWNER: Megan
//
// Creating, updating, listing services, and opening or closing their queues.
//
// Every function returns ok(data) on success or fail(message, status) on
// failure. The route file turns that into an HTTP response.

import { store, findService, waitingFor, nextId, PRIORITIES } from '../data/store.js';
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
 * Every service, each carrying how many people are waiting for it.
 *
 * The count is added here rather than in the screens so that the admin
 * dashboard and the join-queue list cannot disagree about it.
 */
export function listServices() {
  const services = store.services.map((service) => ({
    ...service,
    waiting: waitingFor(service.id).length,
  }));
  return ok(services);
}

export function createService(fields = {}, userId) {
  if (!requireAdmin(userId)) {
    return fail('Only an administrator can manage services.', 403);
  }

  const problem = checkFields(fields);
  if (problem) return fail(problem);

  const service = {
    id: nextId('s'),
    name: String(fields.name).trim(),
    description: String(fields.description).trim(),
    expectedDuration: Number(fields.expectedDuration),
    priority: fields.priority,
    isOpen: true,
  };

  store.services.push(service);
  return ok({ ...service, waiting: 0 });
}

export function updateService(id, fields = {}, userId) {
  if (!requireAdmin(userId)) {
    return fail('Only an administrator can manage services.', 403);
  }

  const service = findService(id);
  if (!service) return fail('Service not found.', 404);

  const problem = checkFields(fields);
  if (problem) return fail(problem);

  service.name = String(fields.name).trim();
  service.description = String(fields.description).trim();
  service.expectedDuration = Number(fields.expectedDuration);
  service.priority = fields.priority;

  return ok({ ...service, waiting: waitingFor(service.id).length });
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

  const service = findService(id);
  if (!service) return fail('Service not found.', 404);

  if (typeof isOpen !== 'boolean') {
    return fail('isOpen must be true or false.');
  }

  service.isOpen = isOpen;
  return ok({ ...service, waiting: waitingFor(service.id).length });
}