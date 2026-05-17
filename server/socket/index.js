const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { Server } = require("socket.io");
const { buildConversationRoom, createPrivateMessage } = require("../services/messageService");

const buildSocketServer = (httpServer, { allowedOrigins = [] } = {}) => {
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const userSockets = new Map();

  const registerSocket = (userId, socketId) => {
    const key = String(userId);
    const existing = userSockets.get(key) || new Set();
    existing.add(socketId);
    userSockets.set(key, existing);
  };

  const unregisterSocket = (userId, socketId) => {
    const key = String(userId);
    const existing = userSockets.get(key);
    if (!existing) return;

    existing.delete(socketId);
    if (existing.size === 0) {
      userSockets.delete(key);
    }
  };

  const emitToUser = (userId, eventName, payload) => {
    io.to(`user:${String(userId)}`).emit(eventName, payload);
  };

  io.emitToUser = emitToUser;
  io.isUserOnline = (userId) => (userSockets.get(String(userId)) || new Set()).size > 0;

  io.use(async (socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "") ||
      null;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select(
        "_id name username role security isDeleted isSuspended",
      );
      if (!user || user.isDeleted) {
        return next(new Error("User not found"));
      }
      if (user.isSuspended) {
        return next(new Error("Account suspended"));
      }
      const tokenSessionVersion = Number(decoded.sv || 0);
      const userSessionVersion = Number(user.security?.sessionVersion || 0);
      if (tokenSessionVersion !== userSessionVersion) {
        return next(new Error("Session expired"));
      }

      socket.user = {
        id: String(user._id),
        name: user.name,
        username: user.username,
        role: user.role,
      };

      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const currentUserId = socket.user.id;
    registerSocket(currentUserId, socket.id);
    socket.join(`user:${currentUserId}`);

    socket.on("joinRoom", (eventId) => {
      socket.join(eventId);
      const room = io.sockets.adapter.rooms.get(eventId);
      const viewerCount = room ? room.size : 0;
      io.to(eventId).emit("viewerCount", viewerCount);
      socket.to(eventId).emit("userJoined", socket.id);
    });

    socket.on("join_conversation", ({ participantId }, callback) => {
      if (!participantId) {
        callback?.({ ok: false, error: "participantId is required" });
        return;
      }

      const room = buildConversationRoom(currentUserId, participantId);
      socket.join(room);
      callback?.({
        ok: true,
        room,
        participantId: String(participantId),
        online: io.isUserOnline(participantId),
      });
    });

    socket.on("leave_conversation", ({ participantId }) => {
      if (!participantId) return;
      socket.leave(buildConversationRoom(currentUserId, participantId));
    });

    socket.on("send_message", async (payload, callback) => {
      try {
        const receiverId = String(payload?.receiverId || "");
        const text = String(payload?.text || "").trim();
        const clientMessageId = payload?.clientMessageId || null;

        if (!receiverId || !text) {
          callback?.({ ok: false, error: "receiverId and text are required" });
          return;
        }

        if (receiverId === currentUserId) {
          callback?.({ ok: false, error: "You cannot message yourself" });
          return;
        }

        const savedMessage = await createPrivateMessage({
          senderId: currentUserId,
          receiverId,
          text,
        });

        const conversationRoom = buildConversationRoom(currentUserId, receiverId);
        const socketMessage = {
          ...savedMessage,
          clientMessageId,
        };

        io.to(conversationRoom).emit("receive_message", socketMessage);
        emitToUser(receiverId, "conversation_update", {
          type: "message",
          conversationId: conversationRoom,
          message: socketMessage,
        });

        callback?.({ ok: true, message: socketMessage });
      } catch (error) {
        console.error("Socket send_message error:", error);
        callback?.({ ok: false, error: "Failed to send message" });
      }
    });

    socket.on("typing_start", ({ receiverId }) => {
      if (!receiverId) return;
      emitToUser(receiverId, "typing_start", { senderId: currentUserId });
    });

    socket.on("typing_stop", ({ receiverId }) => {
      if (!receiverId) return;
      emitToUser(receiverId, "typing_stop", { senderId: currentUserId });
    });

    socket.on("check_presence", ({ userId }, callback) => {
      callback?.({ ok: true, online: io.isUserOnline(userId) });
    });

    socket.on("signal", (data) => {
      io.to(data.to).emit("signal", {
        signal: data.signal,
        from: socket.id,
      });
    });

    socket.on("disconnecting", () => {
      socket.rooms.forEach((room) => {
        const occupancy = io.sockets.adapter.rooms.get(room);
        const isPresenceRoom =
          room === socket.id || room.startsWith("user:") || room.startsWith("conversation:");

        if (!isPresenceRoom && occupancy) {
          io.to(room).emit("viewerCount", occupancy.size - 1);
          io.to(room).emit("userLeft", socket.id);
        }
      });
    });

    socket.on("disconnect", () => {
      unregisterSocket(currentUserId, socket.id);
    });
  });

  return io;
};

module.exports = {
  buildSocketServer,
};
