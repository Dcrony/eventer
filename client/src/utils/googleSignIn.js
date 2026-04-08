import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";

export async function signInWithGoogleAndGetIdToken() {
  if (!auth) {
    throw new Error(
      "Firebase is not configured. Set VITE_FIREBASE_* variables in the client .env."
    );
  }
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user.getIdToken();
}
