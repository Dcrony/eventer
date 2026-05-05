const express = require("express");
const { chatWithAI, generateEvent } = require("../controllers/aiController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireFeature } = require("../middleware/requirePro");
const { rateLimitByUser } = require("../middleware/rateLimitByUser");

const router = express.Router();

router.use(authMiddleware, requireFeature("TICKI_AI"));

router.post(
  "/chat",
  rateLimitByUser({
    windowMs: 30 * 1000,
    max: 8,
    keyPrefix: "tickiai-chat",
    message: "Too many AI requests. Please wait a moment and try again.",
  }),
  chatWithAI,
);

router.post(
  "/generate-event",
  rateLimitByUser({
    windowMs: 60 * 1000,
    max: 10,
    keyPrefix: "tickiai-generate-event",
    message: "Too many event generation requests. Please wait before trying again.",
  }),
  generateEvent,
);

module.exports = router;
