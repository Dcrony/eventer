require("dotenv").config();

const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
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
const favoriteRoutes = require("./routes/favoriteRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const billingRoutes = require("./routes/billingRoutes");
const aiRoutes = require("./routes/aiRoutes");
const donationRoutes = require("./routes/donationRoutes");
const { buildSocketServer } = require("./socket");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const DEFAULT_ALLOWED_ORIGINS = [
  FRONTEND_URL,
  "http://localhost:5173",
  "https://tickispot.com",
];

const EXTRA_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((url) => url.trim()).filter(Boolean)
  : [];

const ALLOWED_ORIGINS = [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...EXTRA_ORIGINS])];

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/webhook", webhookRoutes);
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use("/uploads", express.static("uploads"));
app.use("/uploads/qrcodes", express.static("uploads/qrcodes"));

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
app.use("/api/favorites", favoriteRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/ai", (req, res, next) => {
  console.log("AI route hit:", req.method, req.url);
  next();
}, aiRoutes);

app.use("/api/donations", donationRoutes);

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

const server = http.createServer(app);
const io = buildSocketServer(server, { allowedOrigins: ALLOWED_ORIGINS });

app.set("io", io);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
