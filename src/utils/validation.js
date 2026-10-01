// OWNER: Celeste
//
// The checks every form reuses. Each returns an error message string,
// or null when the value is fine — so a screen can do:
//
//   const error = isValidEmail(email);
//   if (error) setErrors({ ...errors, email: error });

export function isRequired(value, label = 'This field') {
  if (value === null || value === undefined) return `${label} is required.`;
  if (String(value).trim() === '') return `${label} is required.`;
  return null;
}

export function isValidEmail(value) {
  const empty = isRequired(value, 'Email');
  if (empty) return empty;
  // Deliberately simple: something, @, something, dot, something.
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

// Runs several checks and returns the first error, or null.
export function firstError(...checks) {
  return checks.find((c) => c !== null) ?? null;
}