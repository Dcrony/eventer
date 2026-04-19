const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware.js");
const {
  getSettings,
  updateAccount,
  updatePrivacy,
  updateNotifications,
  updateSecurity,
  updateEventPreferences,
  deleteAccount,
} = require("../controllers/settingsController.js");

const router = express.Router();

router.get("/me", authMiddleware, getSettings);
router.put("/account", authMiddleware, updateAccount);
router.put("/privacy", authMiddleware, updatePrivacy);
router.put("/notifications", authMiddleware, updateNotifications);
router.put("/security", authMiddleware, updateSecurity);
router.put("/event-preferences", authMiddleware, updateEventPreferences);
router.delete("/me", authMiddleware, deleteAccount);

router.get("/:id", authMiddleware, getSettings);
router.put("/:id/privacy", authMiddleware, updatePrivacy);
router.put("/notifications/:id", authMiddleware, updateNotifications);
router.delete("/:id", authMiddleware, deleteAccount);

module.exports = router;
