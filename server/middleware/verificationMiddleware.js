const User = require("../models/User");

/**
 * Middleware to verify that a user has verified their email
 * Should be applied after authMiddleware
 */
exports.requireEmailVerification = async (req, res, next) => {
  try {
    // Assume authMiddleware has already attached req.user
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user's email is verified
    if (!req.user.isVerified) {
      return res.status(403).json({
        message: "Email verification required",
        code: "EMAIL_NOT_VERIFIED",
        redirect: "/verify-email",
      });
    }

    next();
  } catch (error) {
    console.error("❌ VERIFICATION MIDDLEWARE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
