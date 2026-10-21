// OWNER: Celestin - shared file, say something in the group chat before changing it.
//
// Server-side validation. These are the same checks as the front end's
// src/utils/validation.js, with the same wording, so a user sees the same
// message whether the check ran in the browser or here.
//
// Why validate twice: the browser check is for the user's convenience and can
// be bypassed entirely by calling the API directly. This one is the real
// protection.
//
// Each function returns an error message string, or null when the value is fine.

export function isRequired(value, label = 'This field') {
  if (value === null || value === undefined) return `${label} is required.`;
  if (String(value).trim() === '') return `${label} is required.`;
  return null;
}

export function isValidEmail(value) {
  const empty = isRequired(value, 'Email');
  if (empty) return empty;
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  return looksLikeEmail ? null : 'Enter a valid email address.';
}

export function minLength(value, n, label = 'This field') {
  const empty = isRequired(value, label);
  if (empty) return empty;
  return String(value).trim().length >= n ? null : `${label} must be at least ${n} characters.`;
}

export function maxLength(value, n, label = 'This field') {
  if (!value) return null;
  return String(value).trim().length <= n ? null : `${label} must be ${n} characters or fewer.`;
}

export function isPositiveNumber(value, label = 'This field') {
  const empty = isRequired(value, label);
  if (empty) return empty;
  const num = Number(value);
  if (!Number.isFinite(num)) return `${label} must be a number.`;
  if (num <= 0) return `${label} must be greater than zero.`;
  if (!Number.isInteger(num)) return `${label} must be a whole number.`;
  return null;
}

export function isOneOf(value, allowed, label = 'This field') {
  return allowed.includes(value) ? null : `${label} must be one of: ${allowed.join(', ')}.`;
}

/** Runs several checks and returns the first error, or null if they all pass. */
export function firstError(...checks) {
  return checks.find((c) => c !== null && c !== undefined) ?? null;
}

// ---------- the shape every module returns ----------
//
// Using these two helpers everywhere means the route layer is identical for
// every endpoint: call the module, check result.ok, send the response.

/** A successful result. */
export const ok = (data) => ({ ok: true, data });

/** A failed result. status defaults to 400 (bad input). */
export const fail = (error, status = 400) => ({ ok: false, error, status });
