/* OWNER: Celeste
This module handles registration, role handling, and logins.
Every function returns ok(data) on success or fail(message, status) on failure. This  becomes
an HTTP response through the route file*/

import bcrypt from 'bcrypt';
import { findUser, findUserByEmail, insertUser, nextId } from '../data/store.js';
import { ok, fail, isRequired, isValidEmail, minLength, firstError } from '../validation.js';
 
export const PASSWORD_MIN = 8;
 
// test costs are lowered to maintain speed
const BCRYPT_ROUNDS = process.env.NODE_ENV === 'test' ? 4 : 10;
 
const EMAIL_TAKEN = 'An account with that email already exists.';
 
// what the API returns
const toPublicUser = ({ id, name, email, role }) => ({ id, name, email, role });
 
//only creates new user accounts as admin cannot register. seed has admin accounts
export function registerUser({ name, email, password } = {}) {
  const problem = firstError(
    isRequired(name, 'Name'),
    isValidEmail(email),
    minLength(password, PASSWORD_MIN, 'Password'),
  );
  if (problem) return fail(problem);
 
  const cleanEmail = String(email).trim().toLowerCase();
 
  // checking if email is taken before db unique check later
  if (findUserByEmail(cleanEmail)) return fail(EMAIL_TAKEN);
 
  let user;
  try {
    /* store.insertUser writes to UserCredentials and UserProfile tables at the 
    same time so neither have incomplete info.*/
    user = insertUser({
      id: nextId('u'),
      name: String(name).trim(),
      email: cleanEmail,
      passwordHash: bcrypt.hashSync(String(password), BCRYPT_ROUNDS),
      role: 'user',
    });
  } catch (err) {
    // db check on whether or not an account is unique
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return fail(EMAIL_TAKEN);
    // checks other constraints that have been ste
    if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
      return fail('Could not create the account. Please check your details.');
    }
    throw err;
  }
 
  return ok(toPublicUser(user));
}
 
//signs user in or gives message for user to manually check which field is wrong
export function loginUser({ email, password } = {}) {
  const problem = firstError(
    isValidEmail(email),
    isRequired(password, 'Password'),
  );
  if (problem) return fail(problem);
 
  const user = findUserByEmail(email);
  if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
    return fail('Email or password is incorrect.');
  }
 
  return ok(toPublicUser(user));
}
 
//returns true when an admin is logging in and protects admin only actions
export function requireAdmin(userId) {
  return findUser(userId)?.role === 'admin';
}
