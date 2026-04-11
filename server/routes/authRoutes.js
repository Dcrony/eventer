const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  firebaseLogin,
  firebaseSync,
  verifyEmailOtp,
  resendOtp,
} = require("../controllers/authControllers");

const upload = multer();

// Original routes
router.post("/register", upload.none(), register);
router.post("/login", login);
router.post("/verify-email", verifyEmail); // Token-based (legacy)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/firebase", firebaseLogin);

// 🆕 Firebase + OTP Email Verification
router.post("/firebase-sync", firebaseSync); // Firebase token → Sync user + Generate OTP
router.post("/verify-otp", verifyEmailOtp); // Verify OTP code
router.post("/resend-otp", resendOtp); // Resend OTP

module.exports = router;
