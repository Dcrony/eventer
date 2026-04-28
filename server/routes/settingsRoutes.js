const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware.js");
const { rateLimitByUser } = require("../middleware/rateLimitByUser.js");
const {
  getSettings,
  updateAccount,
  updatePrivacy,
  updateNotifications,
  updateSecurity,
  updateEventPreferences,
  updateBillingPlan,
  getIntegrations,
  updateIntegration,
  getIntegrationAuthUrl,
  handleGoogleCalendarCallback,
  handleZoomCallback,
  exportSettingsData,
  logoutAllSessions,
  deactivateAccount,
  deleteAccount,
} = require("../controllers/settingsController.js");

const router = express.Router();
const settingsWriteLimiter = rateLimitByUser({
  windowMs: 5 * 60 * 1000,
  max: 20,
  keyPrefix: "settings-write",
  message: "Too many settings updates. Please wait a moment and try again.",
});

router.get("/me", authMiddleware, getSettings);
router.put("/account", authMiddleware, settingsWriteLimiter, updateAccount);
router.put("/privacy", authMiddleware, settingsWriteLimiter, updatePrivacy);
router.put("/notifications", authMiddleware, settingsWriteLimiter, updateNotifications);
router.put("/security", authMiddleware, settingsWriteLimiter, updateSecurity);
router.put("/event-preferences", authMiddleware, settingsWriteLimiter, updateEventPreferences);
router.put("/billing", authMiddleware, settingsWriteLimiter, updateBillingPlan);
router.get("/integrations", authMiddleware, getIntegrations);
router.get("/integrations/:key/auth-url", authMiddleware, getIntegrationAuthUrl);
router.put("/integrations/:key", authMiddleware, settingsWriteLimiter, updateIntegration);
router.get("/integrations/googleCalendar/callback", handleGoogleCalendarCallback);
router.get("/integrations/zoom/callback", handleZoomCallback);
router.get("/export", authMiddleware, exportSettingsData);
router.post("/logout-all", authMiddleware, settingsWriteLimiter, logoutAllSessions);
router.post("/deactivate", authMiddleware, settingsWriteLimiter, deactivateAccount);
router.delete("/me", authMiddleware, settingsWriteLimiter, deleteAccount);

module.exports = router;
