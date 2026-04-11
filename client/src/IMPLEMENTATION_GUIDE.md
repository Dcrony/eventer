// ===============================================================================
// 🔐 EMAIL VERIFICATION WITH OTP - COMPLETE IMPLEMENTATION GUIDE
// ===============================================================================
// Firebase Authentication + Custom 6-Digit OTP Backend System
// ===============================================================================

// ===============================================================================
// 📋 TABLE OF CONTENTS
// ===============================================================================
// 1. Environment Setup
// 2. Backend Configuration
// 3. Frontend Firebase Integration
// 4. Route Protection
// 5. Flow Diagrams
// 6. Troubleshooting

// ===============================================================================
// 1️⃣ ENVIRONMENT SETUP (.env files)
// ===============================================================================

// ---- SERVER .env ----
MONGODB_URI=mongodb://...
JWT_SECRET=your_jwt_secret_here

// Firebase Admin SDK (get from Firebase Console)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

// Email configuration (using Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM="Ticki <onboarding@yourdomain.com>"

// Frontend URL for redirects
FRONTEND_URL=http://localhost:5173

// ---- CLIENT .env (Vite) ----
VITE_API_URL=http://localhost:8080/api
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123...
VITE_FIREBASE_APP_ID=1:123:web:abc...

// ===============================================================================
// 2️⃣ BACKEND CONFIGURATION
// ===============================================================================

// ---- FILE: server/middleware/verificationMiddleware.js ----
// ✅ ALREADY CREATED - Use to protect routes
// Example in routes:

const { requireEmailVerification } = require("../middleware/verificationMiddleware");

// Protect a route
router.get("/protected-route", authMiddleware, requireEmailVerification, controller);

// ---- FILE: server/models/User.js ----
// ✅ ALREADY UPDATED with:
// - verificationCode (hashed 6-digit OTP)
// - verificationCodeExpires (10-min expiration)
// - isVerified (boolean flag)

// ---- FILE: server/controllers/authControllers.js ----
// ✅ THREE NEW METHODS ADDED:
// 1. exports.firebaseSync - Sync Firebase user + generate OTP
// 2. exports.verifyEmailOtp - Verify 6-digit OTP
// 3. exports.resendOtp - Resend OTP

// ---- FILE: server/routes/authRoutes.js ----
// ✅ ALREADY UPDATED with:
router.post("/firebase-sync", firebaseSync);
router.post("/verify-otp", verifyEmailOtp);
router.post("/resend-otp", resendOtp);

// ===============================================================================
// 3️⃣ FRONTEND FIREBASE INTEGRATION - SignUp Component
// ===============================================================================

// ---- FILE: client/src/pages/Register.jsx ----
// Add this to your existing signup component:

/*
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import emailService from "../api/emailVerificationService";

function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Step 1: Create Firebase user
      const firebaseUser = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Step 2: Complete signup flow (sync + OTP generation)
      const idToken = await firebaseUser.user.getIdToken();
      const result = await emailService.firebaseSync(idToken);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Step 3: Store email for verification page
      if (!result.data.user.isVerified) {
        // User needs to verify OTP
        navigate("/verify-otp", {
          state: { email: result.data.user.email },
        });
      } else {
        // User already verified (shouldn't happen in signup flow)
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("user", JSON.stringify(result.data.user));
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Signup failed");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? "Creating Account..." : "Sign Up"}
      </button>
    </form>
  );
}
*/

// ===============================================================================
// 4️⃣ FRONTEND - Router Setup (App.jsx or Router)
// ===============================================================================

/*
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import VerifyEmailOtp from "./pages/VerifyEmailOtp";
import ProtectedRoute from "./components/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify-otp" element={<VerifyEmailOtp />} />

      {/* Protected Routes (require auth + verified email) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* More protected routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
*/

// ===============================================================================
// 5️⃣ PROTECTED ROUTE COMPONENT
// ===============================================================================

// ---- FILE: client/src/components/ProtectedRoute.jsx ----
// Already exists but ensure it checks isVerified:

/*
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  
  if (!token) {
    return <Navigate to="/login" />;
  }

  try {
    const user = JSON.parse(userStr);

    // 🔐 CHECK EMAIL VERIFICATION
    if (!user.isVerified) {
      localStorage.setItem("verifyEmail", user.email);
      return <Navigate to="/verify-otp" />;
    }

    return children;
  } catch (error) {
    return <Navigate to="/login" />;
  }
};

export default ProtectedRoute;
*/

// ===============================================================================
// 6️⃣ BACKEND - USE MIDDLEWARE ON PROTECTED ROUTES
// ===============================================================================

// ---- FILE: server/routes/eventRoutes.js ----
// Protect routes that require verified email:

/*
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireEmailVerification } = require("../middleware/verificationMiddleware");
const { getEvents, createEvent } = require("../controllers/eventController");

// ✅ Both auth AND email verification required
router.get(
  "/",
  authMiddleware,
  requireEmailVerification,
  getEvents
);

router.post(
  "/",
  authMiddleware,
  requireEmailVerification,
  createEvent
);

module.exports = router;
*/

// ===============================================================================
// 7️⃣ FLOW DIAGRAMS (TEXT)
// ===============================================================================

/*
╔═══════════════════════════════════════════════════════════════════════════╗
║                      FIREBASE + OTP SIGNUP FLOW                          ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌─────────────┐                                          ┌──────────────┐
│   FRONTEND  │                                          │   BACKEND    │
└─────────────┘                                          └──────────────┘

     1. User enters email/password
        ├─ Firebase creates account
        └─ Get ID token

     2. Send ID token
        ├─────────────────────────────────────────────────────> firebaseSync
        │

        3. Verify ID token with Firebase Admin SDK
           ├─ Extract email, uid, name
           └─ Check if user exists in MongoDB

        4. New User?
           YES ├─ Create user (isVerified: false)
               ├─ Generate 6-digit OTP
               ├─ Hash OTP with SHA256
               ├─ Store hash + 10-min expiration
               └─ Send OTP via email

        5. Existing User?
           YES ├─ Already verified?
               │  YES ├─ Return JWT token
               │  NO  └─ Regenerate OTP & send email
               └─ Return user status

     6. Response: { user, isVerified: false }
        <─────────────────────────────────────────────────────

     7. Redirect to /verify-otp page
        ├─ Store email in localStorage
        └─ Show 6-digit input boxes


╔═════════════════════════════════════════════════════════════════════════╗
║                      OTP VERIFICATION FLOW                             ║
╚═════════════════════════════════════════════════════════════════════════╝

     1. User enters 6 digits: 123456
        ├─ Send email + otp
        └─────────────────────────────────────────────────────> verifyOtp

        2. Hash input OTP: sha256("123456")
           ├─ Compare with stored hash
           ├─ Check if expired
           └─ If match + not expired:

        3. Update user:
           ├─ Set isVerified = true
           ├─ Clear verificationCode
           ├─ Clear verificationCodeExpires
           └─ Save to DB

        4. Create JWT token
           └─ Return token + user

     5. Response: { token, user }
        <─────────────────────────────────────────────────────

     6. Store token & redirect
        ├─ localStorage.token = JWT
        ├─ localStorage.user = JSON
        └─ navigate("/dashboard")

     7. Protected routes now:
        ├─ Check token (authMiddleware)
        └─ Check isVerified (requireEmailVerification)


╔═════════════════════════════════════════════════════════════════════════╗
║                      RESEND OTP FLOW                                    ║
╚═════════════════════════════════════════════════════════════════════════╝

     1. User clicks "Resend Code"
        ├─────────────────────────────────────────────────────> resendOtp

        2. Find user by email
           ├─ Generate NEW 6-digit OTP
           ├─ Hash it
           ├─ Store with NEW 10-min expiration
           └─ Send email

     3. Response: { message: "New code sent" }
        <─────────────────────────────────────────────────────

     4. User sees timer reset to 10:00
        └─ Ready to enter new code

*/

// ===============================================================================
// 8️⃣ TESTING THE FLOW
// ===============================================================================

// Using Postman or cURL:

// --- 1. Create Firebase User & Get ID Token ---
// In your frontend console after signup:
// firebase.auth().currentUser.getIdToken().then(token => console.log(token))

// --- 2. Test Firebase Sync ---
// POST http://localhost:8080/api/auth/firebase-sync
// Body: {
//   "idToken": "eyJhbGciOiJSUzI1NiIs..."
// }

// --- 3. Test OTP Verification ---
// POST http://localhost:8080/api/auth/verify-otp
// Body: {
//   "email": "user@example.com",
//   "otp": "123456"
// }

// --- 4. Test Resend OTP ---
// POST http://localhost:8080/api/auth/resend-otp
// Body: {
//   "email": "user@example.com"
// }

// ===============================================================================
// 9️⃣ TROUBLESHOOTING
// ===============================================================================

/*
❌ Issue: Firebase Admin SDK returns "Certificate not found"
✅ Solution:
   - Download service account JSON from Firebase Console
   - Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
   - Ensure private key includes \n correctly in .env

❌ Issue: OTP email not sending
✅ Solution:
   - Check RESEND_API_KEY is valid
   - Check RESEND_FROM is formatted correctly
   - Test: console.log in sendEmail() utility

❌ Issue: User created but OTP not appearing
✅ Solution:
   - Check user.isVerified in MongoDB
   - Check user.verificationCode exists (should be hashed)
   - Check verificationCodeExpires is in future

❌ Issue: "Email verification required" on protected routes
✅ Solution:
   This is EXPECTED if user hasn't verified yet
   - Middleware will redirect to /verify-otp
   - User must complete OTP verification first

❌ Issue: OTP validation fails with "Invalid OTP"
✅ Solution:
   - Ensure OTP is exactly 6 digits
   - Check OTP hasn't expired (> 10 mins)
   - OTP is one-time use, cannot reuse same code
   - Use Resend if expired

❌ Issue: Token not working after verification
✅ Solution:
   - Check localStorage has both "token" and "user"
   - Token should have 7-day expiration
   - Verify authMiddleware is attached to request headers
*/

// ===============================================================================
// 🔟 SECURITY BEST PRACTICES
// ===============================================================================

/*
✅ OTP Security:
   - OTPs are hashed with SHA256 before storage
   - Database never stores plaintext OTP
   - OTP has 10-minute expiration
   - Email service logs are sanitized
   - Rate limiting on resend endpoint (optional)

✅ Firebase Security:
   - ID tokens verified on backend
   - Firebase Admin SDK validates signature
   - Private key kept in .env (not in code)

✅ JWT Security:
   - Tokens expire in 7 days
   - Refresh token logic (implement as needed)
   - Tokens stored in localStorage (consider httpOnly cookies)
*/

// ===============================================================================
// 🎉 YOU'RE ALL SET!
// ===============================================================================
// The complete Firebase + OTP email verification system is ready to use!
//
// Summary of What Was Added:
// ✅ User Model: Added OTP fields with expiration
// ✅ Middleware: Email verification gate
// ✅ Controllers: firebaseSync, verifyEmailOtp, resendOtp
// ✅ Routes: /firebase-sync, /verify-otp, /resend-otp
// ✅ React Component: VerifyEmailOtp.jsx with UI
// ✅ Service: emailVerificationService.js for API calls
//
// Next Steps:
// 1. Update your Firebase configuration
// 2. Update environment variables
// 3. Import VerifyEmailOtp in your router
// 4. Add requireEmailVerification middleware to protected routes
// 5. Test the complete flow!
