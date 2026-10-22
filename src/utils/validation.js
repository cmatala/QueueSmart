// OWNER: Celeste
//
/*This page checks whether or not a password fulfills the requirements needed to make one. These
checks are the same as server/validation.js checks but is done in browser for efficiency*/

export function isRequired(value, label = 'This field') {
  if (value === null || value === undefined) return `${label} is required.`;
  if (String(value).trim() === '') return `${label} is required.`;
  return null;
}

export function isValidEmail(value) {
  const empty = isRequired(value, 'Email');
  if (empty) return empty;
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  return looksLikeEmail ? null : 'Enter a valid email address.';
}

export function minLength(value, n, label = 'This field') {
  const empty = isRequired(value, label);
  if (empty) return empty;
  return value.trim().length >= n ? null : `${label} must be at least ${n} characters.`;
}

export function maxLength(value, n, label = 'This field') {
  if (!value) return null;
  return value.trim().length <= n ? null : `${label} must be ${n} characters or fewer.`;
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

export function matches(value, other, label = 'Passwords') {
  return value === other ? null : `${label} do not match.`;
}

/** leaves the actual errors only */
export function collectErrors(candidate) {
  return Object.fromEntries(Object.entries(candidate).filter(([, message]) => message));
}
