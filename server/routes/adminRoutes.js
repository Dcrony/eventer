const express = require("express");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const {
  getPlatformStats,
  getRevenueAnalytics,
  getAllUsers,
  getUserDetails,
  toggleUserStatus,
  updateUserRole,
  deleteUser,
  getAllEvents,
  updateEventStatus,
  toggleEventFeatured,
  getTransactions,
  exportTransactions,
  getActivityLogs,
  sendAnnouncement,
  getAnnouncements,
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
router.patch("/users/:userId/role", updateUserRole);
router.delete("/users/:userId", deleteUser);

// Event Management
router.get("/events", getAllEvents);
router.patch("/events/:eventId/status", updateEventStatus);
router.patch("/events/:eventId/featured", toggleEventFeatured);

// Transactions
router.get("/transactions", getTransactions);
router.get("/transactions/export", exportTransactions);

// Activity Logs
router.get("/logs", getActivityLogs);

// Announcement Management
router.get("/announcements", getAnnouncements);
router.post("/announcement", sendAnnouncement);

module.exports = router;
