import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

function trimEnv(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

const projectId = trimEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID);
const apiKey = trimEnv(import.meta.env.VITE_FIREBASE_API_KEY);
const appId = trimEnv(import.meta.env.VITE_FIREBASE_APP_ID);
const messagingSenderId = trimEnv(
  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
);

const authDomain =
  trimEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) ||
  (projectId ? `${projectId}.firebaseapp.com` : "");

const storageBucket =
  trimEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) ||
  (projectId ? `${projectId}.appspot.com` : "");

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  ...(trimEnv(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID)
    ? { measurementId: trimEnv(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) }
    : {}),
};

const hasClientAuthConfig =
  Boolean(apiKey) &&
  Boolean(projectId) &&
  Boolean(appId) &&
  Boolean(messagingSenderId) &&
  Boolean(authDomain) &&
  Boolean(storageBucket);

if (import.meta.env.DEV && apiKey && !hasClientAuthConfig) {
  const missing = [
    !apiKey && "VITE_FIREBASE_API_KEY",
    !projectId && "VITE_FIREBASE_PROJECT_ID",
    !appId && "VITE_FIREBASE_APP_ID",
    !messagingSenderId && "VITE_FIREBASE_MESSAGING_SENDER_ID",
    !authDomain && "VITE_FIREBASE_AUTH_DOMAIN (or set PROJECT_ID for default)",
    !storageBucket &&
      "VITE_FIREBASE_STORAGE_BUCKET (or set PROJECT_ID for default)",
  ].filter(Boolean);
  console.warn(
    "[Firebase] Incomplete web config; Google sign-in will be disabled until set:",
    missing.join(", ")
  );
}

export const firebaseApp = hasClientAuthConfig
  ? getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig)
  : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;

if (typeof window !== "undefined" && firebaseApp) {
  isSupported().then((yes) => {
    if (yes) getAnalytics(firebaseApp);
  });
}
