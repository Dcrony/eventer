const express = require("express");
const router = express.Router();
const passport = require("passport");
const multer = require("multer");
const { register, login, verifyEmail, forgotPassword, resetPassword } = require("../controllers/authControllers");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// 🧩 Multer for form-data parsing (no file uploads yet)
const upload = multer();

// ✅ Register route
router.post("/register", upload.none(), register);

// ✅ Login route
router.post("/login", login);

// ✅ Verify email route
router.post("/verify-email", verifyEmail);

// ✅ Forgot password route
router.post("/forgot-password", forgotPassword);

// ✅ Reset password route
router.post("/reset-password", resetPassword);

// ✅ Google OAuth routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/login` }),
  (req, res) => {
  // Generate JWT token
  const jwt = require("jsonwebtoken");
  const JWT_SECRET = process.env.JWT_SECRET;
  const frontEndUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const token = jwt.sign(
    {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      isAdmin: req.user.role === "admin",
      isOrganizer: req.user.role === "organizer",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Store token in session/cookie and redirect to frontend
  // The token will be passed via query param for client-side storage
  const redirectUrl = `${frontEndUrl}/login?token=${encodeURIComponent(token)}&email=${encodeURIComponent(req.user.email)}&username=${encodeURIComponent(req.user.username)}`;
  res.redirect(redirectUrl);
});

module.exports = router;
