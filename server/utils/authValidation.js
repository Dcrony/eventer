/**
 * Server-side sanitization and validation for auth routes (security).
 * Use before processing login/register to reject bad input and normalize strings.
 */

const EMAIL_MAX_LENGTH = 254;
const FULL_NAME_MIN_LENGTH = 2;
const FULL_NAME_MAX_LENGTH = 100;
const USERNAME_MIN_LENGTH = 2;
const USERNAME_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const PHONE_DIGITS_MIN = 10;
const PHONE_DIGITS_MAX = 15;

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
/** Letters (incl. unicode marks), spaces, hyphens, apostrophes, periods */
const FULL_NAME_REGEX = /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u;

function sanitizeString(value, maxLength = 500) {
  if (value == null) return "";
  const s = String(value)
    .replace(/\0/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim();
  return s.length > maxLength ? s.slice(0, maxLength) : s;
}

function sanitizePassword(value) {
  if (value == null) return "";
  const s = String(value).replace(/[\x00-\x1F\x7F]/g, "");
  return s.length > PASSWORD_MAX_LENGTH ? s.slice(0, PASSWORD_MAX_LENGTH) : s;
}

/**
 * Sanitize and validate login body. Returns { ok: true, email, password } or { ok: false, message }.
 */
function validateLoginBody(body) {
  const email = body?.email != null ? sanitizeString(String(body.email), EMAIL_MAX_LENGTH).toLowerCase() : "";
  const password = body?.password != null ? sanitizePassword(body.password) : "";

  if (!email) return { ok: false, message: "Email is required" };
  if (email.length > EMAIL_MAX_LENGTH) return { ok: false, message: "Invalid email" };
  if (!EMAIL_REGEX.test(email)) return { ok: false, message: "Invalid email format" };
  if (!password) return { ok: false, message: "Password is required" };
  if (password.length < PASSWORD_MIN_LENGTH) return { ok: false, message: "Invalid credentials" };
  if (password.length > PASSWORD_MAX_LENGTH) return { ok: false, message: "Invalid credentials" };

  return { ok: true, email, password };
}

/**
 * Full name: trim, collapse spaces, max length.
 */
function sanitizeFullName(raw) {
  if (raw == null) return "";
  const s = sanitizeString(String(raw), FULL_NAME_MAX_LENGTH)
    .replace(/\s+/g, " ")
    .trim();
  return s;
}

/**
 * Phone: digits only for storage (E.164 local number max 15 digits).
 */
function sanitizePhoneDigits(raw) {
  if (raw == null) return "";
  return String(raw).replace(/\D/g, "").slice(0, PHONE_DIGITS_MAX);
}

/**
 * Sanitize and validate register body.
 * Returns { ok: true, fullName, username, email, phone, password } or { ok: false, message }.
 * Role is always "user" — never trust client-sent flags for admin/organizer.
 */
function validateRegisterBody(body) {
  const rawFullName = body?.fullName ?? body?.name;
  const rawUsername = body?.username;
  const rawEmail = body?.email;
  const rawPhone = body?.phone;
  const rawPassword = body?.password;

  const fullName = sanitizeFullName(rawFullName);
  const username = rawUsername != null
    ? sanitizeString(String(rawUsername), USERNAME_MAX_LENGTH).replace(/[^a-zA-Z0-9_-]/g, "")
    : "";
  const email = rawEmail != null ? sanitizeString(String(rawEmail), EMAIL_MAX_LENGTH).toLowerCase() : "";
  const phoneDigits = sanitizePhoneDigits(rawPhone);
  const password = rawPassword != null ? sanitizePassword(rawPassword) : "";

  if (!fullName) return { ok: false, message: "Full name is required" };
  if (fullName.length < FULL_NAME_MIN_LENGTH) return { ok: false, message: "Full name is too short" };
  if (fullName.length > FULL_NAME_MAX_LENGTH) return { ok: false, message: "Full name is too long" };
  if (!FULL_NAME_REGEX.test(fullName)) {
    return { ok: false, message: "Full name can only contain letters, spaces, hyphens, apostrophes, and periods" };
  }

  if (!username) return { ok: false, message: "Username is required" };
  if (username.length < USERNAME_MIN_LENGTH) return { ok: false, message: "Username is too short" };
  if (username.length > USERNAME_MAX_LENGTH) return { ok: false, message: "Username is too long" };
  if (!USERNAME_REGEX.test(username)) return { ok: false, message: "Username contains invalid characters" };

  if (!email) return { ok: false, message: "Email is required" };
  if (email.length > EMAIL_MAX_LENGTH) return { ok: false, message: "Invalid email" };
  if (!EMAIL_REGEX.test(email)) return { ok: false, message: "Invalid email format" };

  if (!phoneDigits) return { ok: false, message: "Phone number is required" };
  if (phoneDigits.length < PHONE_DIGITS_MIN) {
    return { ok: false, message: "Phone number must be at least 10 digits" };
  }
  if (phoneDigits.length > PHONE_DIGITS_MAX) {
    return { ok: false, message: "Phone number is too long" };
  }

  if (!password) return { ok: false, message: "Password is required" };
  if (password.length < PASSWORD_MIN_LENGTH) return { ok: false, message: "Password must be at least 8 characters" };
  if (password.length > PASSWORD_MAX_LENGTH) return { ok: false, message: "Password is too long" };

  return {
    ok: true,
    fullName,
    username,
    email,
    phone: phoneDigits,
    password,
  };
}

function validateEmailOnly(rawEmail) {
  const email = rawEmail != null ? sanitizeString(String(rawEmail), EMAIL_MAX_LENGTH).toLowerCase() : "";
  if (!email) return { ok: false, message: "Email is required" };
  if (!EMAIL_REGEX.test(email)) return { ok: false, message: "Invalid email format" };
  return { ok: true, email };
}

module.exports = {
  validateLoginBody,
  validateRegisterBody,
  validateEmailOnly,
};
