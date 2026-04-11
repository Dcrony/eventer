const express = require("express");
const {
  sendMessage,
  getMessages,
  getConversations,
  markMessagesAsRead,
  sendEventMessage,
  getEventMessages,
} = require("../controllers/messageController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Private chat routes
router.post("/", sendMessage);
router.put("/read/:otherUserId", markMessagesAsRead);
router.get("/:userId", getMessages);
router.get("/", getConversations);

// Event live chat routes
router.post("/event", sendEventMessage);
router.get("/event/:eventId", getEventMessages);

module.exports = router;