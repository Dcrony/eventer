const express = require("express");
const {
  sendMessage,
  getMessages,
  getConversations,
  markMessagesAsRead,
} = require("../controllers/messageController");

const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Send message
router.post("/", authMiddleware, sendMessage);

// Get messages with a user
router.get("/:userId", authMiddleware, getMessages);

// Get all conversations (note: must come after specific routes)
router.put("/read/:otherUserId", authMiddleware, markMessagesAsRead);
router.get("/", authMiddleware, getConversations);

module.exports = router;