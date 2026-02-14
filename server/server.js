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
const settingsRoutes = require("./routes/settingsRoutes")


const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";


const app = express();

app.use(cors());
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
app.use("/api/webhook", webhookRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/profile", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes)

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: `${FRONTEND_URL}`, // frontend port
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("⚡ New user connected");

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

  socket.on("signal", (data) => {
    io.to(data.to).emit("signal", {
      signal: data.signal,
      from: socket.id,
    });
  });

  socket.on("sendMessage", (msg) => {
    io.to(msg.eventId).emit("receiveMessage", msg);
  });

  socket.on("disconnecting", () => {
    // Before actual disconnect, update room counts
    socket.rooms.forEach(room => {
      const occupancy = io.sockets.adapter.rooms.get(room);
      if (occupancy) {
        io.to(room).emit("viewerCount", occupancy.size - 1);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });
});

// port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
