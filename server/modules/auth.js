/* OWNER: Celeste
This module handles registration, role handling, and logins.
Every function returns ok(data) on success or fail(message, status) on failure. This  becomes
an HTTP response through the route file*/

import { store, findUserByEmail, findUser, nextId } from '../data/store.js';
import { ok, fail, isRequired, isValidEmail, minLength, firstError } from '../validation.js';

export const PASSWORD_MIN = 8;

//copy of a user without the password field
const withoutPassword = ({ password, ...rest }) => rest;

//only creates new user accounts as admin cannot register. store.js has admin accounts
export function registerUser({ name, email, password } = {}) {
  const problem = firstError(
    isRequired(name, 'Name'),
    isValidEmail(email),
    minLength(password, PASSWORD_MIN, 'Password'),
  );
  if (problem) return fail(problem);

  if (findUserByEmail(email)) {
    return fail('An account with that email already exists.');
  }

  const user = {
    id: nextId('u'),
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    password: String(password),
    role: 'user',
  };

  store.users.push(user);
  return ok(withoutPassword(user));
}

//signs user in or gives message for user to manually check which field is wrong
export function loginUser({ email, password } = {}) {
  const problem = firstError(
    isValidEmail(email),
    isRequired(password, 'Password'),
  );
  if (problem) return fail(problem);

  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return fail('Email or password is incorrect.');
  }

  return ok(withoutPassword(user));
}

//returns true when an admin is logging in and protects admin only actions
export function requireAdmin(userId) {
  return findUser(userId)?.role === 'admin';
}
