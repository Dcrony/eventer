const express = require("express");
const {
  sendMessage,
  getMessages,
  getConversations,
} = require("../controllers/messageController");

const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Send message
router.post("/", authMiddleware, sendMessage);

// Get messages with a user
router.get("/:userId", authMiddleware, getMessages);

// Get all conversations
router.get("/", authMiddleware, getConversations);

module.exports = router;