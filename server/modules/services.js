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
//
// Creating, updating, listing services, and opening or closing their queues.
//
// Every function returns ok(data) on success or fail(message, status) on
// failure. Import those from ../validation.js.

import { store, findService, waitingFor, nextId, PRIORITIES } from '../data/store.js';
import { ok, fail, isRequired, maxLength, isPositiveNumber, isOneOf, firstError } from '../validation.js';
import { requireAdmin } from './auth.js';

export const NAME_MAX = 100;

// Same checks for create and update. Returns an error message or null.
function validateFields({ name, description, expectedDuration, priority } = {}) {
  return firstError(
    isRequired(name, 'Service name'),
    maxLength(name, NAME_MAX, 'Service name'),
    isRequired(description, 'Description'),
    isPositiveNumber(expectedDuration, 'Expected duration'),
    isOneOf(priority, PRIORITIES, 'Priority'),
  );
}

const notAdmin = () => fail('Administrator access required.', 403);

const withWaiting = (service) => ({ ...service, waiting: waitingFor(service.id).length });

export function listServices() {
  return ok(store.services.map(withWaiting));
}

export function createService(fields = {}, userId) {
  if (!requireAdmin(userId)) return notAdmin();

  const error = validateFields(fields);
  if (error) return fail(error, 400);

  const service = {
    id: nextId('s'),
    name: String(fields.name).trim(),
    description: String(fields.description).trim(),
    expectedDuration: Number(fields.expectedDuration),
    priority: fields.priority,
    isOpen: true,
  };
  store.services.push(service);
  return ok(withWaiting(service));
}

export function updateService(id, fields = {}, userId) {
  if (!requireAdmin(userId)) return notAdmin();

  const service = findService(id);
  if (!service) return fail('Service not found.', 404);

  const error = validateFields(fields);
  if (error) return fail(error, 400);

  service.name = String(fields.name).trim();
  service.description = String(fields.description).trim();
  service.expectedDuration = Number(fields.expectedDuration);
  service.priority = fields.priority;
  return ok(withWaiting(service));
}

export function setServiceOpen(id, isOpen, userId) {
  if (!requireAdmin(userId)) return notAdmin();

  const service = findService(id);
  if (!service) return fail('Service not found.', 404);

  if (typeof isOpen !== 'boolean') return fail('isOpen must be true or false.', 400);

  service.isOpen = isOpen;
  return ok(withWaiting(service));
}