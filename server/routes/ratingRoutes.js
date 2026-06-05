const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const ratingController = require("../controllers/ratingController");

// Public endpoints
router.get("/stats", ratingController.getRatingStats);
router.get("/list", ratingController.getReviews);
router.get("/organizer/:organizerId/reputation", ratingController.getOrganizerReputation);

// User endpoints (authenticated)
router.post("/submit", authMiddleware, ratingController.submitReview);
router.post("/report", authMiddleware, ratingController.submitReport);
router.post("/:reviewId/helpful", authMiddleware, ratingController.markReviewHelpful);

// Admin endpoints
router.get("/admin/reports", authMiddleware, authorizeRoles("admin", "super_admin", "moderator", "support_admin"), ratingController.adminGetReports);
router.post("/admin/report/:reportId/resolve", authMiddleware, authorizeRoles("admin", "super_admin", "moderator", "support_admin"), ratingController.adminResolveReport);

module.exports = router;
