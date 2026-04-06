const express = require("express");
const router = express.Router();
const passport = require("passport");
const multer = require("multer");
const { register, login, verifyEmail, forgotPassword, resetPassword } = require("../controllers/authControllers");

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

router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  // Generate JWT token
  const jwt = require("jsonwebtoken");
  const JWT_SECRET = process.env.JWT_SECRET;
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
  const redirectUrl = `${process.env.FRONTEND_URL}/login?token=${token}&email=${req.user.email}&username=${req.user.username}`;
  res.redirect(redirectUrl);
});

module.exports = router;
