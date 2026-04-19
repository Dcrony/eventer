require("dotenv").config();

const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const statRoutes = require("./routes/statRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const messageRoutes = require("./routes/messageRoutes");


const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
// localhost vs 127.0.0.1 are different origins — include both for Vite dev + preview.
const DEFAULT_ALLOWED_ORIGINS = [
  FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "https://tickispot.vercel.app",
  "https://tickispot.pxxl.click",
];
const EXTRA_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((url) => url.trim()).filter(Boolean)
  : [];
// Merge so ALLOWED_ORIGINS in .env adds hosts without removing local dev URLs.
const ALLOWED_ORIGINS = [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...EXTRA_ORIGINS])];

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use("/api/webhook", webhookRoutes);
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));


// Serve static files from the "uploads" folder
app.use("/uploads", express.static("uploads"));
app.use("/uploads/qrcodes", express.static("uploads/qrcodes"));


// ROUTES

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api", withdrawalRoutes);
app.use("/api/messages", messageRoutes);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large (max 10MB)." });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err?.message && String(err.message).includes("Only image files")) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  return res.status(500).json({ message: "Server error" });
});

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("⚡ New user connected:", socket.id);

  // JOIN ROOM (for Live Stream)
  socket.on("joinRoom", (eventId) => {
    socket.join(eventId);
    console.log(`User joined room: ${eventId}`);

    // Get viewer count for the room
    const room = io.sockets.adapter.rooms.get(eventId);
    const viewerCount = room ? room.size : 0;
    io.to(eventId).emit("viewerCount", viewerCount);

    // Notify broadcaster that a new viewer has joined
    socket.to(eventId).emit("userJoined", socket.id);
  });

  // USER CONNECT (for Chat/Online status) — keys normalized to strings for reliable lookups
  socket.on("addUser", (userId) => {
    if (userId != null && userId !== "") {
      const id = String(userId);
      onlineUsers.set(id, socket.id);
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    }
  });

  // Let a client refresh the current online list (e.g. after switching chats) without rebroadcasting to everyone
  socket.on("requestOnlineUsers", () => {
    socket.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
  });

  // SEND MESSAGE (General/Event Chat)
  socket.on("sendMessage", (msg) => {
    // If it's a direct message (has receiverId)
    if (msg.receiverId) {
      const receiverSocket = onlineUsers.get(String(msg.receiverId));
      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", {
          senderId: msg.senderId,
          text: msg.text,
          createdAt: new Date(),
        });
      }
    } 
    // If it's an event room message (has eventId)
    else if (msg.eventId) {
      io.to(msg.eventId).emit("receiveMessage", msg);
    }
  });

  // TYPING
  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers.get(String(receiverId));
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", senderId);
    }
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers.get(String(receiverId));
    if (receiverSocket) {
      io.to(receiverSocket).emit("stopTyping", senderId);
    }
  });

  // WEB RTC SIGNALING
  socket.on("signal", (data) => {
    io.to(data.to).emit("signal", {
      signal: data.signal,
      from: socket.id,
    });
  });

  // DISCONNECTING
  socket.on("disconnecting", () => {
    // Before actual disconnect, update room counts
    socket.rooms.forEach(room => {
      const occupancy = io.sockets.adapter.rooms.get(room);
      if (occupancy) {
        io.to(room).emit("viewerCount", occupancy.size - 1);
        io.to(room).emit("userLeft", socket.id);
      }
    });
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
  });
});

// port
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
