const Message = require("../models/Message");

const PRIVATE_MESSAGE_POPULATE = [
  { path: "sender", select: "name username profilePic email" },
  { path: "receiver", select: "name username profilePic email" },
];

const buildConversationRoom = (leftUserId, rightUserId) =>
  `conversation:${[String(leftUserId), String(rightUserId)].sort().join(":")}`;

const normalizePrivateMessage = (message) => {
  const data = message.toObject ? message.toObject() : message;

  return {
    ...data,
    senderId: data.sender?._id ? String(data.sender._id) : String(data.sender),
    receiverId: data.receiver?._id ? String(data.receiver._id) : String(data.receiver),
    text: data.text,
    createdAt: data.createdAt,
    seen: Boolean(data.seen),
  };
};

const createPrivateMessage = async ({ senderId, receiverId, text }) => {
  const created = await Message.create({
    messageType: "private",
    sender: senderId,
    receiver: receiverId,
    text,
    seen: false,
  });

  const populated = await Message.findById(created._id).populate(PRIVATE_MESSAGE_POPULATE);
  return normalizePrivateMessage(populated);
};

module.exports = {
  PRIVATE_MESSAGE_POPULATE,
  buildConversationRoom,
  normalizePrivateMessage,
  createPrivateMessage,
};
