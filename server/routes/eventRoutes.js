const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireEmailVerification } = require("../middleware/verificationMiddleware");
const { uploadImageMemory } = require("../middleware/imageUploadMemory");
const { checkPlanLimit } = require("../middleware/planLimitMiddleware");
const {
  createEvent,
  getAllEvents,
  getEventById,
  getMyEvents,
  getEventBuyers,
  toggleLiveStream,
  updateEvent,
  deleteEvent,
  trackEventView,
  toggleEventLike,
  getEventComments,
  addEventComment,
  trackEventShare,
  getEventAnalytics,
  fixEventCapacity,
} = require("../controllers/eventController");

// Create event (authenticated, verified, plan-limited)
router.post(
  "/create",
  authMiddleware,
  requireEmailVerification,
  checkPlanLimit,
  uploadImageMemory.single("image"),
  createEvent
);

// Public — fetch all events
router.get("/", getAllEvents);

// Authenticated routes (specific paths before :id wildcard)
router.get("/my-events", authMiddleware, getMyEvents);
router.get("/buyers/:eventId", authMiddleware, getEventBuyers);
router.get("/:eventId/tickets", authMiddleware, getEventBuyers); // alias

router.patch("/toggle-live", authMiddleware, toggleLiveStream);

router.get("/:id/comments", getEventComments);
router.post("/:id/comments", authMiddleware, addEventComment);
router.post("/:id/like", authMiddleware, toggleEventLike);
router.post("/:id/share", trackEventShare);
router.post("/:id/view", trackEventView);
router.get("/:id/analytics", authMiddleware, getEventAnalytics);

router.put(
  "/update/:eventId",
  authMiddleware,
  uploadImageMemory.single("image"),
  updateEvent
);
router.delete("/delete/:eventId", authMiddleware, deleteEvent);
router.get("/fix-capacity", fixEventCapacity);
// Wildcard — must be last
router.get("/:id", getEventById);



module.exports = router;