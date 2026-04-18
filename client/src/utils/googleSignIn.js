import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";

export async function signInWithGoogleAndGetIdToken() {
  if (!auth) {
    throw new Error(
      "Firebase web app is not configured. In client/.env set VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID, and VITE_FIREBASE_MESSAGING_SENDER_ID (copy from Firebase Console → Project settings → Your apps). VITE_FIREBASE_AUTH_DOMAIN and VITE_FIREBASE_STORAGE_BUCKET are optional if they match the usual {projectId}.firebaseapp.com and {projectId}.appspot.com."
    );
  }
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user.getIdToken();
  } catch (err) {
    if (err?.code === "auth/configuration-not-found") {
      throw new Error(
        "Firebase Auth is not available for this API key and project. In Firebase Console open Authentication, complete setup, enable Google as a sign-in provider, and copy the web SDK config into client/.env. If you use a custom API key in Google Cloud, enable the Identity Toolkit API for the same project."
      );
    }
    throw err;
  }
}
