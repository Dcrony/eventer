const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireEmailVerification } = require("../middleware/verificationMiddleware");
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
} = require("../controllers/eventController");

// ✅ Multer configuration for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/event_image"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.post(
  "/create",
  authMiddleware,
  requireEmailVerification,
  checkPlanLimit,
  upload.single("image"),
  createEvent,
);

// Public route - fetch all events
router.get("/", getAllEvents);

// Authenticated routes
router.get("/my-events", authMiddleware, getMyEvents);
router.get("/buyers/:eventId", authMiddleware, getEventBuyers);
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
  upload.single("image"),
  updateEvent
  
);
router.delete("/delete/:eventId", authMiddleware, deleteEvent);

router.get("/:id", getEventById);

module.exports = router;
