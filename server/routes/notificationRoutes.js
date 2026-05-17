const express = require("express");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const {
  getMyNotifications,
  markAsRead,
  createNotification,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const router = express.Router();

// Admin-only manual notifications (system uses notificationService internally)
router.post("/", authMiddleware, authorizeRoles("admin"), createNotification);
router.get("/my", authMiddleware, getMyNotifications);
router.put("/:id/read", authMiddleware, markAsRead);
router.put("/mark-all", authMiddleware, markAllAsRead);
router.delete("/:id", authMiddleware, deleteNotification);

module.exports = router;
