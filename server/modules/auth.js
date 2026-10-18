// OWNER: Celeste
//
// Registration, login, and role handling.
//
// Every function returns ok(data) on success or fail(message, status) on
// failure. Import those from ../validation.js.
//
// TODO Celeste — implement:
//
//   registerUser({ name, email, password })
//     Rejects: missing name, invalid email, password under 8 characters,
//              an email that already exists.
//     Always creates role 'user'. Never 'admin'.
//     Returns the user WITHOUT the password field.
//
//   loginUser({ email, password })
//     Rejects: invalid email format, missing password, unknown email.
//     Returns { id, name, email, role }.
//
//   requireAdmin(userId) -> true / false
//     Other modules call this to guard administrator actions.

import { store, findUserByEmail, findUser, nextId } from '../data/store.js';
import { ok, fail, isRequired, isValidEmail, minLength, firstError } from '../validation.js';

export function registerUser({ name, email, password } = {}) {
  return fail('Not implemented yet.', 501);
}

export function loginUser({ email, password } = {}) {
  return fail('Not implemented yet.', 501);
}

export function requireAdmin(userId) {
  return findUser(userId)?.role === 'admin';
}
