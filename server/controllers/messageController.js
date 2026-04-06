const Message = require("../models/Message");
const User = require("../models/User");

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, text } = req.body;

    if (!receiverId || !text) {
      return res.status(400).json({ msg: "All fields required" });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ msg: "You can't message yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ msg: "Receiver not found" });
    }

//     const sender = await User.findById(senderId);

// if (!sender.following.includes(receiverId)) {
//   return res.status(403).json({ msg: "You must follow user to message" });
// }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      text,
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
.populate("sender", "name profilePic")
    .populate("receiver", "name profilePic");

    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender receiver", "name profilePic");

    const conversations = {};

    messages.forEach((msg) => {
      const otherUser =
        msg.sender._id.toString() === userId
          ? msg.receiver
          : msg.sender;

      if (!conversations[otherUser._id]) {
        conversations[otherUser._id] = {
          user: otherUser,
          lastMessage: msg,
          unreadCount: 0,
        };
      }

      // Count unread messages (messages not seen by current user)
      if (!msg.seen && msg.receiver.toString() === userId) {
        conversations[otherUser._id].unreadCount++;
      }
    });

    res.json(Object.values(conversations));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

 const markMessagesAsRead = async (req, res) => {
   try {
     const userId = req.user.id;
     const { otherUserId } = req.params;

     await Message.updateMany(
       { sender: otherUserId, receiver: userId, seen: false },
       { seen: true }
     );

     res.json({ msg: "Messages marked as read" });
   } catch (err) {
     res.status(500).json({ msg: err.message });
  }
};

module.exports = {
    sendMessage,
    getMessages,
    getConversations,
    markMessagesAsRead,
};