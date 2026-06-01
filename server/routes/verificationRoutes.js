const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const { uploadImageMemory } = require("../middleware/imageUploadMemory");
const verificationController = require("../controllers/verificationController");

// Organizer submits verification documents (multipart/form-data)
router.post(
  "/submit",
  authMiddleware,
  authorizeRoles("organizer"),
  uploadImageMemory.array("documents", 6),
  verificationController.submitVerification,
);

// Organizer views their verification
router.get("/me", authMiddleware, authorizeRoles("organizer"), verificationController.getMyVerification);

// Admin: list verification requests
router.get("/admin/queue", authMiddleware, authorizeRoles("admin", "super_admin", "moderator", "finance_admin", "support_admin"), verificationController.adminList);

// Admin: review a verification
router.post("/admin/:id/review", authMiddleware, authorizeRoles("admin", "super_admin", "moderator", "finance_admin", "support_admin"), verificationController.adminReview);

// Admin: get a verification by id
router.get("/admin/:id", authMiddleware, authorizeRoles("admin", "super_admin", "moderator", "finance_admin", "support_admin"), verificationController.getVerificationById);

module.exports = router;
