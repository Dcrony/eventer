require("dotenv").config();
const dotenv = require("dotenv");

const express = require("express");
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


const app = express();

app.use(cors());

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

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: `${FRONTEND_URL}`,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

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

  // USER CONNECT (for Chat/Online status)
  socket.on("addUser", (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    }
  });

  // SEND MESSAGE (General/Event Chat)
  socket.on("sendMessage", (msg) => {
    // If it's a direct message (has receiverId)
    if (msg.receiverId) {
      const receiverSocket = onlineUsers.get(msg.receiverId);
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
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", senderId);
    }
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers.get(receiverId);
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
