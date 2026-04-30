const admin = require("firebase-admin");

let initialized = false;

function normalizePrivateKey(rawPrivateKey) {
  if (!rawPrivateKey) return "";
  // Support values wrapped in single/double quotes and escaped newlines.
  return String(rawPrivateKey)
    .trim()
    .replace(/^"(.*)"$/s, "$1")
    .replace(/^'(.*)'$/s, "$1")
    .replace(/\\n/g, "\n");
}

function parseServiceAccountFromEnv() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  const candidates = [String(raw).trim()];
  try {
    candidates.push(Buffer.from(raw, "base64").toString("utf8").trim());
  } catch (_error) {
    // Ignore invalid base64 and continue with raw parsing.
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: normalizePrivateKey(parsed.private_key),
        };
      }
    } catch (_error) {
      // Try next candidate.
    }
  }

  return null;
}

function initFirebaseAdmin() {
  if (initialized) return;

  const jsonCredentials = parseServiceAccountFromEnv();
  const projectId = jsonCredentials?.projectId || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = jsonCredentials?.clientEmail || process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = jsonCredentials?.privateKey || normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
  initialized = true;
}

function isFirebaseConfigured() {
  initFirebaseAdmin();
  return admin.apps.length > 0;
}

async function verifyIdToken(idToken) {
  initFirebaseAdmin();
  if (!admin.apps.length) {
    const error = new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY, or provide FIREBASE_SERVICE_ACCOUNT_JSON."
    );
    error.code = "FIREBASE_ADMIN_NOT_CONFIGURED";
    throw error;
  }
  return admin.auth().verifyIdToken(idToken);
}

module.exports = { verifyIdToken, isFirebaseConfigured };
