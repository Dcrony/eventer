const express = require("express");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const {
  getPlatformStats,
  getRevenueAnalytics,
  getAllUsers,
  getUserDetails,
  toggleUserStatus,
  getAllEvents,
  updateEventStatus,
  toggleEventFeatured,
  getTransactions,
  getActivityLogs,
  sendAnnouncement,
  getPlatformMetrics,
} = require("../controllers/adminController");

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(authorizeRoles("admin"));

// Dashboard & Analytics
router.get("/stats", getPlatformStats);
router.get("/revenue", getRevenueAnalytics);
router.get("/metrics", getPlatformMetrics);

// User Management
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetails);
router.patch("/users/:userId/status", toggleUserStatus);

// Event Management
router.get("/events", getAllEvents);
router.patch("/events/:eventId/status", updateEventStatus);
router.patch("/events/:eventId/featured", toggleEventFeatured);

// Transactions
router.get("/transactions", getTransactions);

// Activity Logs
router.get("/logs", getActivityLogs);

// Platform Control
router.post("/announcement", sendAnnouncement);

module.exports = router;
