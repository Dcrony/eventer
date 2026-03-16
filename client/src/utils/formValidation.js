/**
 * Form sanitization and validation for auth forms (security).
 * Use sanitize on input before storing/sending; use validators before submit.
 */

// --- Constants (align with server / User model) ---
const EMAIL_MAX_LENGTH = 254;
const USERNAME_MIN_LENGTH = 2;
const USERNAME_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 128;

// Email: standard format, no leading/trailing spaces
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Username: alphanumeric, underscore, hyphen, 2–30 chars (no spaces, no special chars that could break things)
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Sanitize a string: trim, remove control characters, limit length.
 * Prevents null bytes and control chars from being sent to the server.
 */
export function sanitizeString(value, maxLength = 500) {
  if (value == null || typeof value !== "string") return "";
  let s = value
    .replace(/[\x00-\x1F\x7F]/g, "") // strip control chars and DEL
    .trim();
  return s.length > maxLength ? s.slice(0, maxLength) : s;
}

/**
 * Sanitize email: lowercase, trim, strip control chars, enforce max length.
 */
export function sanitizeEmail(value) {
  return sanitizeString(value, EMAIL_MAX_LENGTH).toLowerCase();
}

/**
 * Sanitize username: trim, strip control chars and disallowed chars, enforce length.
 */
export function sanitizeUsername(value) {
  const trimmed = sanitizeString(value, USERNAME_MAX_LENGTH);
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * Sanitize password: no trim (spaces can be intentional), strip control chars, enforce max length.
 */
export function sanitizePassword(value) {
  if (value == null || typeof value !== "string") return "";
  const noControl = value.replace(/[\x00-\x1F\x7F]/g, "");
  return noControl.length > PASSWORD_MAX_LENGTH ? noControl.slice(0, PASSWORD_MAX_LENGTH) : noControl;
}

// --- Validation (returns error message or null) ---

export function validateEmail(value) {
  const s = value?.trim();
  if (!s) return "Email is required";
  if (s.length > EMAIL_MAX_LENGTH) return "Email is too long";
  if (!EMAIL_REGEX.test(s)) return "Enter a valid email address";
  return null;
}

export function validateUsername(value) {
  const s = value?.trim();
  if (!s) return "Username is required";
  if (s.length < USERNAME_MIN_LENGTH) return `Username must be at least ${USERNAME_MIN_LENGTH} characters`;
  if (s.length > USERNAME_MAX_LENGTH) return `Username must be at most ${USERNAME_MAX_LENGTH} characters`;
  if (!USERNAME_REGEX.test(s)) return "Username can only contain letters, numbers, underscores and hyphens";
  return null;
}

export function validatePassword(value, fieldLabel = "Password") {
  if (value == null || typeof value !== "string") return `${fieldLabel} is required`;
  if (value.length < PASSWORD_MIN_LENGTH) return `${fieldLabel} must be at least ${PASSWORD_MIN_LENGTH} characters`;
  if (value.length > PASSWORD_MAX_LENGTH) return `${fieldLabel} must be at most ${PASSWORD_MAX_LENGTH} characters`;
  return null;
}

/**
 * Run all login validations. Returns { valid: boolean, errors: { email?, password? } }.
 */
export function validateLoginForm({ email, password }) {
  const errors = {};
  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;
  const passwordErr = validatePassword(password, "Password");
  if (passwordErr) errors.password = passwordErr;
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Run all register validations. Returns { valid: boolean, errors: { username?, email?, password? } }.
 */
export function validateRegisterForm({ username, email, password }) {
  const errors = {};
  const usernameErr = validateUsername(username);
  if (usernameErr) errors.username = usernameErr;
  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;
  const passwordErr = validatePassword(password, "Password");
  if (passwordErr) errors.password = passwordErr;
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
