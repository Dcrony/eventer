const express = require("express");
const router = express.Router();
const multer = require("multer");
const { rateLimitByIp } = require("../middleware/rateLimitByIp");

const authLimiter = rateLimitByIp({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyPrefix: "auth",
  message: "Too many authentication attempts. Please try again later.",
});

const otpLimiter = rateLimitByIp({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "auth-otp",
  message: "Too many verification attempts. Please try again later.",
});
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
router.post("/register", authLimiter, upload.none(), register);
router.post("/login", authLimiter, login);
router.post("/verify-email", authLimiter, verifyEmail); // Token-based (legacy)
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/firebase", authLimiter, firebaseLogin);

// Firebase + OTP Email Verification
router.post("/firebase-sync", authLimiter, firebaseSync);
router.post("/verify-otp", otpLimiter, verifyEmailOtp);
router.post("/resend-otp", otpLimiter, resendOtp);

module.exports = router;
