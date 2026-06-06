const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const { uploadImageMemory } = require("../middleware/imageUploadMemory");
const verificationController = require("../controllers/verificationController");

router.use((req, res, next) => {
  console.log("Verification router hit:", req.method, req.path);
  next();
});

// Organizer submits verification documents (multipart/form-data)
router.post(
  "/submit",
  authMiddleware,
  authorizeRoles("organizer"),
  uploadImageMemory.array("documents", 6),
  verificationController.submitVerification,
);

// Organizer views their verification
router.get("/me", authMiddleware, authorizeRoles("organizer", "admin", "super_admin", "moderator", "finance_admin", "support_admin"), verificationController.getMyVerification);

// Admin: list verification requests
router.get("/admin/queue", authMiddleware, authorizeRoles("admin", "super_admin", "moderator", "finance_admin", "support_admin"), verificationController.adminList);

// Admin: get a verification by id
router.get("/admin/:id", authMiddleware, authorizeRoles("admin", "super_admin", "moderator", "finance_admin", "support_admin"), verificationController.getVerificationById);

// Admin: request resubmission
router.patch("/admin/:id/resubmit", authMiddleware, authorizeRoles("admin", "super_admin", "moderator", "finance_admin", "support_admin"), verificationController.adminRequestResubmission);

// Admin: suspend verification (mark as under investigation)
router.patch("/admin/:id/suspend", authMiddleware, authorizeRoles("admin", "super_admin", "moderator", "finance_admin", "support_admin"), verificationController.adminSuspendVerification);

// Admin: restore verification from suspension
router.patch("/admin/:id/restore", authMiddleware, authorizeRoles("admin", "super_admin", "moderator", "finance_admin", "support_admin"), verificationController.adminRestoreVerification);

// Admin: get audit history for a verification
router.get("/admin/:id/audit-history", authMiddleware, authorizeRoles("admin", "super_admin", "moderator", "finance_admin", "support_admin"), verificationController.getVerificationAuditHistory);

// Admin: review a verification
router.post("/admin/:id/review", authMiddleware, authorizeRoles("admin", "super_admin", "moderator", "finance_admin", "support_admin"), verificationController.adminReview);

module.exports = router;
