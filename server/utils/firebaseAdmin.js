const admin = require("firebase-admin");

let initialized = false;

function initFirebaseAdmin() {
  if (initialized) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
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
    throw new Error("Firebase Admin is not configured");
  }
  return admin.auth().verifyIdToken(idToken);
}

module.exports = { verifyIdToken, isFirebaseConfigured };
