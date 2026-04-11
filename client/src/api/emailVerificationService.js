/**
 * ===================================================
 * EMAIL VERIFICATION API SERVICE WITH OTP
 * Firebase + Custom OTP Backend Flow
 * ===================================================
 *
 * This service handles:
 * 1. Firebase sign-up & sync
 * 2. OTP generation and sending
 * 3. OTP verification
 * 4. Resend OTP
 */

import API from "./axios";

// ===================================================
// 1️⃣ FIREBASE SYNC - After Firebase email/password signup
// ===================================================
/**
 * Sync Firebase user with backend
 * - Verifies Firebase ID token
 * - Creates new user in DB if doesn't exist
 * - Generates & sends 6-digit OTP
 * - Returns user status
 *
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise} { user, message, isVerified }
 */
export const firebaseSync = async (idToken) => {
  try {
    const response = await API.post("/auth/firebase-sync", {
      idToken,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Firebase sync failed",
    };
  }
};

// ===================================================
// 2️⃣ VERIFY OTP - User enters 6-digit code
// ===================================================
/**
 * Verify the 6-digit OTP code
 * - Hashes the provided OTP
 * - Compares with stored hash
 * - Checks expiration (10 mins)
 * - Returns JWT token on success
 *
 * @param {string} email - User email
 * @param {string} otp - 6-digit code (e.g., "123456")
 * @returns {Promise} { token, user, message }
 */
export const verifyEmailOtp = async (email, otp) => {
  try {
    const response = await API.post("/auth/verify-otp", {
      email,
      otp,
    });

    // Store token & user
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    localStorage.removeItem("verifyEmail");

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "OTP verification failed",
      code: error.response?.data?.code,
    };
  }
};

// ===================================================
// 3️⃣ RESEND OTP - Generate new code
// ===================================================
/**
 * Resend verification code to user's email
 * - Generates new 6-digit OTP
 * - Hash and stores with 10-min expiration
 * - Sends email
 *
 * @param {string} email - User email
 * @returns {Promise} { message }
 */
export const resendOtp = async (email) => {
  try {
    const response = await API.post("/auth/resend-otp", {
      email,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Failed to resend OTP",
    };
  }
};

// ===================================================
// USAGE EXAMPLES
// ===================================================

/**
 * EXAMPLE 1: Complete Firebase Sign-up Flow
 * ==========================================
 *
 * Step 1: User signs up with Firebase (in your SignUp component)
 * Step 2: Get & send idToken to backend
 * Step 3: Backend generates OTP & sends email
 * Step 4: Redirect to verify OTP page
 * Step 5: User enters code & verifies
 * Step 6: Redirect to dashboard
 */

export const completeFirebaseSignupFlow = async (firebaseUser) => {
  try {
    // Get ID token from Firebase user
    const idToken = await firebaseUser.getIdToken();

    // Step 1: Sync with backend (creates user, generates OTP)
    const syncResult = await firebaseSync(idToken);

    if (!syncResult.success) {
      throw new Error(syncResult.error);
    }

    // Step 2: Check if already verified (Google Sign-In doesn't need OTP)
    if (syncResult.data.user.isVerified) {
      // Already verified - proceed to dashboard
      localStorage.setItem("token", syncResult.data.token);
      localStorage.setItem("user", JSON.stringify(syncResult.data.user));
      return {
        verified: true,
        redirect: "/dashboard",
      };
    }

    // Step 3: Not verified - store email and redirect to OTP page
    localStorage.setItem("verifyEmail", syncResult.data.user.email);
    return {
      verified: false,
      redirect: "/verify-otp",
      email: syncResult.data.user.email,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Signup flow failed",
    };
  }
};

/**
 * EXAMPLE 2: Firebase Sign-in Integration
 * ========================================
 * Use existing firebaseLogin endpoint but enhanced
 */
export const firebaseSignIn = async (idToken) => {
  try {
    // If using the old firebaseLogin endpoint
    const response = await API.post("/auth/firebase", {
      idToken,
    });

    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));

    return {
      success: true,
      data: response.data,
      redirect: "/dashboard",
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Sign-in failed",
    };
  }
};

/**
 * EXAMPLE 3: React Component Usage
 * ================================
 */

/*
// In your SignUp.jsx component:

import { completeFirebaseSignupFlow } from "../api/emailService";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";

function SignUp() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth); // Firebase auth state

  const handleSignUp = async (email, password) => {
    try {
      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Complete signup flow (sync + OTP)
      const result = await completeFirebaseSignupFlow(userCredential.user);

      if (result.verified) {
        // Already verified - go to dashboard
        navigate(result.redirect);
      } else {
        // Need to verify - go to OTP page
        navigate(result.redirect, {
          state: { email: result.email },
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  return (
    // Your signup form UI
  );
}

// ===================================================================

// In your VerifyEmailOtp.jsx component (already provided):

import { verifyEmailOtp, resendOtp } from "../api/emailService";

function VerifyEmailOtp() {
  const handleVerify = async (otp) => {
    const result = await verifyEmailOtp(email, otp);

    if (result.success) {
      // Token is already stored
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
  };

  const handleResend = async () => {
    const result = await resendOtp(email);

    if (result.success) {
      setSuccess("New code sent!");
    } else {
      setError(result.error);
    }
  };

  return (
    // Your OTP input UI
  );
}
*/

// =============================================================
// HELPER: Redirect to OTP page on unverified user
// =============================================================
export const handleUnverifiedUser = (email) => {
  localStorage.setItem("verifyEmail", email);
  window.location.href = "/verify-otp";
};

// =============================================================
// Export all as object for convenience
// =============================================================
export default {
  firebaseSync,
  verifyEmailOtp,
  resendOtp,
  completeFirebaseSignupFlow,
  firebaseSignIn,
  handleUnverifiedUser,
};
