/**
 * Form sanitization and validation for auth forms (security).
 * Use sanitize on input before storing/sending; use validators before submit.
 */

// --- Constants (align with server / User model) ---
const EMAIL_MAX_LENGTH = 254;
const FULL_NAME_MIN_LENGTH = 2;
const FULL_NAME_MAX_LENGTH = 100;
const USERNAME_MIN_LENGTH = 2;
const USERNAME_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const PHONE_DIGITS_MIN = 10;
const PHONE_DIGITS_MAX = 15;

// Email: standard format, no leading/trailing spaces
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Username: alphanumeric, underscore, hyphen, 2–30 chars (no spaces, no special chars that could break things)
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

// Full name: letters (incl. unicode), spaces, hyphens, apostrophes, periods
const FULL_NAME_REGEX = /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u;

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
 * Full name: trim, collapse spaces, max length.
 */
export function sanitizeFullName(value) {
  const s = sanitizeString(value, FULL_NAME_MAX_LENGTH).replace(/\s+/g, " ").trim();
  return s;
}

/**
 * Phone: keep user-visible formatting in UI; strip to digits for validation.
 */
export function sanitizePhone(value) {
  if (value == null || typeof value !== "string") return "";
  return value.replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 24);
}

export function phoneDigitsOnly(value) {
  return String(value || "").replace(/\D/g, "").slice(0, PHONE_DIGITS_MAX);
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

export function validateFullName(value) {
  const s = sanitizeFullName(value);
  if (!s) return "Full name is required";
  if (s.length < FULL_NAME_MIN_LENGTH) return `Full name must be at least ${FULL_NAME_MIN_LENGTH} characters`;
  if (s.length > FULL_NAME_MAX_LENGTH) return "Full name is too long";
  if (!FULL_NAME_REGEX.test(s)) {
    return "Use letters only (spaces, hyphens, apostrophes, and periods allowed)";
  }
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

export function validatePhone(value) {
  const digits = phoneDigitsOnly(value);
  if (!digits) return "Phone number is required";
  if (digits.length < PHONE_DIGITS_MIN) {
    return `Enter at least ${PHONE_DIGITS_MIN} digits (country code included if applicable)`;
  }
  if (digits.length > PHONE_DIGITS_MAX) return "Phone number is too long";
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
 * Run all register validations.
 * Returns { valid, errors: { fullName?, username?, email?, phone?, password? } }.
 */
export function validateRegisterForm({ fullName, username, email, phone, password }) {
  const errors = {};
  const fullNameErr = validateFullName(fullName);
  if (fullNameErr) errors.fullName = fullNameErr;
  const usernameErr = validateUsername(username);
  if (usernameErr) errors.username = usernameErr;
  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;
  const phoneErr = validatePhone(phone);
  if (phoneErr) errors.phone = phoneErr;
  const passwordErr = validatePassword(password, "Password");
  if (passwordErr) errors.password = passwordErr;
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
