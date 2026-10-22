// OWNER: Celeste
//
// Tests for auth.js: registerUser, loginUser, requireAdmin

import { describe, test, expect, beforeEach } from 'vitest';
import { resetStore } from '../data/store.js';
import { registerUser, loginUser, requireAdmin } from '../modules/auth.js';

beforeEach(() => {
  resetStore();
});

const newAccount = {
  name: 'Sam Carter',
  email: 'sam@example.com',
  password: 'sam12345',
};

describe('registerUser', () => {
  test('creates an account and returns it without the password', () => {
    const result = registerUser(newAccount);

    expect(result.ok).toBe(true);
    expect(result.data.name).toBe('Sam Carter');
    expect(result.data.role).toBe('user');
    expect(result.data.password).toBeUndefined();
    expect(store.users).toHaveLength(7);
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
    expect(result.error).toBe('An account with that email already exists.');
    expect(store.users).toHaveLength(6);
  });

  test('never creates an administrator, even when asked to', () => {
    const result = registerUser({ ...newAccount, role: 'admin' });

    expect(result.data.role).toBe('user');
  });
});

describe('loginUser', () => {
  test('signs in a known user and reports their role', () => {
    const result = loginUser({ email: 'alex@queuesmart.edu', password: 'alex1234' });

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ id: 'u2', name: 'Alex Rivera', role: 'user' });
    expect(result.data.password).toBeUndefined();
  });

  test('reports the admin role for the admin account', () => {
    const result = loginUser({ email: 'admin@queuesmart.edu', password: 'admin123' });

    expect(result.data.role).toBe('admin');
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
