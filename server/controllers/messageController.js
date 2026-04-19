const Message = require("../models/Message");
const User = require("../models/User");
const {
  PRIVATE_MESSAGE_POPULATE,
  buildConversationRoom,
  createPrivateMessage,
  normalizePrivateMessage,
} = require("../services/messageService");

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, text } = req.body;

    if (!receiverId || !text) {
      return res.status(400).json({ msg: "All fields required" });
    }

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({ msg: "You can't message yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ msg: "Receiver not found" });
    }

    const savedMessage = await createPrivateMessage({
      senderId,
      receiverId,
      text: String(text).trim(),
    });

    const io = req.app.get("io");
    if (io?.emitToUser) {
      const conversationId = buildConversationRoom(senderId, receiverId);
      io.to(conversationId).emit("receive_message", savedMessage);
      io.emitToUser(receiverId, "conversation_update", {
        type: "message",
        conversationId,
        message: savedMessage,
      });
    }

    res.status(201).json(savedMessage);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ msg: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    if (!otherUserId) {
      return res.status(400).json({ msg: "User ID is required" });
    }

    const messages = await Message.find({
      messageType: "private",
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate(PRIVATE_MESSAGE_POPULATE);

    res.json(messages.map(normalizePrivateMessage));
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ msg: err.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({
      messageType: "private",
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate(PRIVATE_MESSAGE_POPULATE);

    if (!messages.length) {
      return res.json([]);
    }

    const conversationsMap = new Map();

    messages.forEach((msg) => {
      const otherUser = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;

      if (!otherUser || !otherUser._id) {
        return;
      }

      const otherUserId = otherUser._id.toString();

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user: {
            id: otherUser._id,
            name: otherUser.name || "Unknown User",
            username: otherUser.username,
            profilePic: otherUser.profilePic || null,
            email: otherUser.email,
          },
          lastMessage: {
            id: msg._id,
            text: msg.text,
            createdAt: msg.createdAt,
            sender: msg.sender._id.toString(),
            seen: msg.seen,
          },
          unreadCount: 0,
        });
      }

      if (!msg.seen && msg.receiver._id.toString() === userId) {
        conversationsMap.get(otherUserId).unreadCount += 1;
      }
    });

    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt),
    );

    res.json(conversations);
  } catch (err) {
    console.error("Get conversations error:", err);
    res.status(500).json({ msg: err.message });
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    if (!otherUserId) {
      return res.status(400).json({ msg: "Other user ID is required" });
    }

    const result = await Message.updateMany(
      {
        messageType: "private",
        sender: otherUserId,
        receiver: userId,
        seen: false,
      },
      { seen: true },
    );

    const io = req.app.get("io");
    if (io?.emitToUser) {
      io.emitToUser(otherUserId, "conversation_update", {
        type: "read_receipt",
        conversationId: buildConversationRoom(userId, otherUserId),
        readerId: userId,
      });
    }

    res.json({
      msg: "Messages marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Mark messages as read error:", err);
    res.status(500).json({ msg: err.message });
  }
};

const sendEventMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventId, message } = req.body;

    if (!eventId || !message) {
      return res.status(400).json({ msg: "Event ID and message are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const eventMessage = await Message.create({
      messageType: "event",
      eventId,
      userId,
      username: user.username || user.name,
      message,
    });

    const populatedMessage = await Message.findById(eventMessage._id)
      .populate("userId", "name username profilePic")
      .populate("eventId", "title");

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("Send event message error:", err);
    res.status(500).json({ msg: err.message });
  }
};

const getEventMessages = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ msg: "Event ID is required" });
    }

    const messages = await Message.find({
      messageType: "event",
      eventId,
    })
      .sort({ createdAt: 1 })
      .populate("userId", "name username profilePic")
      .populate("eventId", "title");

    res.json(messages);
  } catch (err) {
    console.error("Get event messages error:", err);
    res.status(500).json({ msg: err.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
  markMessagesAsRead,
  sendEventMessage,
  getEventMessages,
};
