/**
 * Server-side sanitization and validation for auth routes (security).
 * Use before processing login/register to reject bad input and normalize strings.
 */

const EMAIL_MAX_LENGTH = 254;
const USERNAME_MIN_LENGTH = 2;
const USERNAME_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 128;

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

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
 * Sanitize and validate register body. Returns { ok: true, username, email, password, isOrganizer } or { ok: false, message }.
 */
function validateRegisterBody(body) {
  const rawUsername = body?.username;
  const rawEmail = body?.email;
  const rawPassword = body?.password;

  const username = rawUsername != null
    ? sanitizeString(String(rawUsername), USERNAME_MAX_LENGTH).replace(/[^a-zA-Z0-9_-]/g, "")
    : "";
  const email = rawEmail != null ? sanitizeString(String(rawEmail), EMAIL_MAX_LENGTH).toLowerCase() : "";
  const password = rawPassword != null ? sanitizePassword(rawPassword) : "";
  const isOrganizer = body?.isOrganizer === "true" || body?.isOrganizer === true;
  const isAdmin = body?.isAdmin === "true" || body?.isAdmin === true;

  if (!username) return { ok: false, message: "Username is required" };
  if (username.length < USERNAME_MIN_LENGTH) return { ok: false, message: "Username is too short" };
  if (username.length > USERNAME_MAX_LENGTH) return { ok: false, message: "Username is too long" };
  if (!USERNAME_REGEX.test(username)) return { ok: false, message: "Username contains invalid characters" };

  if (!email) return { ok: false, message: "Email is required" };
  if (email.length > EMAIL_MAX_LENGTH) return { ok: false, message: "Invalid email" };
  if (!EMAIL_REGEX.test(email)) return { ok: false, message: "Invalid email format" };

  if (!password) return { ok: false, message: "Password is required" };
  if (password.length < PASSWORD_MIN_LENGTH) return { ok: false, message: "Password must be at least 6 characters" };
  if (password.length > PASSWORD_MAX_LENGTH) return { ok: false, message: "Password is too long" };

  return {
    ok: true,
    username,
    email,
    password,
    isOrganizer,
    isAdmin,
  };
}

module.exports = {
  validateLoginBody,
  validateRegisterBody,
};
