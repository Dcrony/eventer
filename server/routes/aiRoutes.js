const express = require("express");
const { chatWithAI, generateEvent, generateImage } = require("../controllers/aiController");
const { rateLimitByUser } = require("../middleware/rateLimitByUser");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireFeature } = require("../middleware/requirePro");

const router = express.Router();

router.use(authMiddleware, requireFeature("TICKI_AI"));

router.post(
  "/chat",
  rateLimitByUser({
    windowMs: 30 * 1000,
    max: 8,
    keyPrefix: "ai-chat",
    message: "Too many AI requests. Please wait a moment and try again.",
  }),
  chatWithAI,
);

router.post(
  "/generate-event",
  rateLimitByUser({
    windowMs: 60 * 1000,
    max: 10,
    keyPrefix: "ai-generate-event",
    message: "Too many event generation requests. Please wait before trying again.",
  }),
  generateEvent,
);

/**
 * POST /ai/generate-image
 * Fetches a relevant cover image from Unsplash (or Picsum fallback)
 * Rate-limited to 15 per minute per user.
 */
router.post(
  "/generate-image",
  rateLimitByUser({
    windowMs: 60 * 1000,
    max: 15,
    keyPrefix: "ai-generate-image",
    message: "Too many image generation requests. Please wait before trying again.",
  }),
  generateImage,
);

module.exports = router;