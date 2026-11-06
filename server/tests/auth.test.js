// OWNER: Celeste
//
// Tests for auth.js: registerUser, loginUser, requireAdmin

import { describe, test, expect, beforeEach } from 'vitest';
import { resetStore } from '../data/store.js';
import { db } from '../db/connection.js';
import { registerUser, loginUser, requireAdmin } from '../modules/auth.js';
 
const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
 
// counts rows after resetting db so number of accounts in demo isn't assumed
let before;
 
beforeEach(() => {
  resetStore();
  before = { credentials: count('UserCredentials'), profiles: count('UserProfile') };
});
 
const newAccount = {
  name: 'Sam Carter',
  email: 'sam@example.com',
  password: 'sam12345',
};
 
const credentialsFor = (email) =>
  db.prepare('SELECT * FROM UserCredentials WHERE email = ?').get(email);
 
describe('registerUser', () => {
  test('creates an account and returns it without the password', () => {
    const result = registerUser(newAccount);
 
    expect(result.ok).toBe(true);
    expect(result.data.name).toBe('Sam Carter');
    expect(result.data.role).toBe('user');
    expect(result.data.password).toBeUndefined();
    expect(result.data.password_hash).toBeUndefined();
    expect(count('UserCredentials')).toBe(before.credentials + 1);
  });
 
  test('writes one row to each user table', () => {
    const result = registerUser(newAccount);
 
    const profile = db
      .prepare('SELECT * FROM UserProfile WHERE user_id = ?')
      .get(result.data.id);
 
    expect(count('UserCredentials')).toBe(before.credentials + 1);
    expect(count('UserProfile')).toBe(before.profiles + 1);
    expect(profile.full_name).toBe('Sam Carter');
    expect(credentialsFor('sam@example.com').user_id).toBe(result.data.id);
  });
 
  test('the stored password is a bcrypt hash, never the password itself', () => {
    registerUser(newAccount);
 
    const stored = credentialsFor('sam@example.com').password_hash;
 
    expect(stored).not.toBe(newAccount.password);
    expect(stored).not.toContain(newAccount.password);
    expect(stored).toMatch(/^\$2[aby]\$/);
    expect(stored).toHaveLength(60);
  });
 
  test('no readable password exists anywhere in the credentials table', () => {
    const rows = db.prepare('SELECT password_hash FROM UserCredentials').all();
 
    for (const { password_hash } of rows) {
      expect(password_hash).toMatch(/^\$2[aby]\$/);
    }
  });
 
  test('rejects a missing name', () => {
    const result = registerUser({ ...newAccount, name: '   ' });
 
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toBe('Name is required.');
  });
 
  test('rejects a malformed email', () => {
    const result = registerUser({ ...newAccount, email: 'sam-at-example' });
 
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Enter a valid email address.');
  });
 
  test('rejects a password under 8 characters', () => {
    const result = registerUser({ ...newAccount, password: 'short' });
 
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Password must be at least 8 characters.');
  });
 
  test('rejects an email that already has an account', () => {
    const result = registerUser({ ...newAccount, email: 'alex@queuesmart.edu' });
 
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toBe('An account with that email already exists.');
    expect(count('UserCredentials')).toBe(before.credentials);
    expect(count('UserProfile')).toBe(before.profiles);
  });
 
  test('treats a different capitalisation of an existing email as a duplicate', () => {
    const result = registerUser({ ...newAccount, email: 'ALEX@QueueSmart.edu' });
 
    expect(result.ok).toBe(false);
    expect(result.error).toBe('An account with that email already exists.');
  });
 
  test('the UNIQUE constraint refuses a duplicate email even without our check', () => {
    const insertDuplicate = () =>
      db
        .prepare(
          `INSERT INTO UserCredentials (user_id, email, password_hash)
           VALUES ('u99', 'alex@queuesmart.edu', ?)`,
        )
        .run('x'.repeat(60));
 
    expect(insertDuplicate).toThrow(/UNIQUE/);
  });
 
  test('a failure halfway through leaves neither user row behind', () => {
    /* UserProfile table has a cap at 100 chars, so although tests pass,
    table specifications are violated so changes aren't inserted to db*/
    const result = registerUser({ ...newAccount, name: 'A'.repeat(101) });
 
    expect(result.ok).toBe(false);
    expect(credentialsFor('sam@example.com')).toBeUndefined();
    expect(count('UserCredentials')).toBe(before.credentials);
    expect(count('UserProfile')).toBe(before.profiles);
  });
 
  test('never creates an administrator, even when asked to', () => {
    const result = registerUser({ ...newAccount, role: 'admin' });
 
    expect(result.data.role).toBe('user');
    expect(credentialsFor('sam@example.com').role).toBe('user');
  });
});
 
describe('loginUser', () => {
  test('signs in a known user and reports their role', () => {
    const result = loginUser({ email: 'alex@queuesmart.edu', password: 'alex1234' });
 
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ id: 'u2', name: 'Alex Rivera', role: 'user' });
    expect(result.data.password).toBeUndefined();
  });
 
  test('the response is exactly {id, name, email, role} and never the hash', () => {
    const result = loginUser({ email: 'alex@queuesmart.edu', password: 'alex1234' });
 
    expect(Object.keys(result.data).sort()).toEqual(['email', 'id', 'name', 'role']);
  });
 
  test('reports the admin role for the admin account', () => {
    const result = loginUser({ email: 'admin@queuesmart.edu', password: 'admin123' });
 
    expect(result.data.role).toBe('admin');
  });
 
  test('a newly registered user can sign in with the password they chose', () => {
    registerUser(newAccount);
    const result = loginUser({ email: 'sam@example.com', password: 'sam12345' });
 
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ name: 'Sam Carter', role: 'user' });
  });
 
  test('ignores capitals in the email', () => {
    const result = loginUser({ email: 'ALEX@QueueSmart.edu', password: 'alex1234' });
 
    expect(result.ok).toBe(true);
  });
 
  test('gives the same message for a wrong password and an unknown email', () => {
    const wrongPassword = loginUser({ email: 'alex@queuesmart.edu', password: 'nope' });
    const unknownEmail = loginUser({ email: 'nobody@example.com', password: 'whatever' });
 
    expect(wrongPassword.ok).toBe(false);
    expect(unknownEmail.ok).toBe(false);
    expect(wrongPassword.error).toBe(unknownEmail.error);
  });
 
  test('the stored hash itself is not accepted as a password', () => {
    const { password_hash } = credentialsFor('alex@queuesmart.edu');
    const result = loginUser({ email: 'alex@queuesmart.edu', password: password_hash });
 
    expect(result.ok).toBe(false);
  });
 
  test('rejects a missing password before looking anyone up', () => {
    const result = loginUser({ email: 'alex@queuesmart.edu' });
 
    expect(result.error).toBe('Password is required.');
  });
});
 
describe('requireAdmin', () => {
  test('is true for the admin and false for everyone else', () => {
    expect(requireAdmin('u1')).toBe(true);
    expect(requireAdmin('u2')).toBe(false);
    expect(requireAdmin('nobody')).toBe(false);
  });
});
