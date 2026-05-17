require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
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
const analyticsRoutes = require("./routes/analyticsRoutes");
const liveStreamRoutes = require("./routes/liveStreamRoutes");
const teamRoutes = require("./routes/teamRoutes");
const privateEventRoutes = require("./routes/privateEventRoutes");
const adminRoutes = require("./routes/adminRoutes");
const User = require("./models/User");
const Event = require("./models/Event");
const { PLAN_TYPES } = require("./services/subscriptionService");
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
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

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

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api/webhook", webhookRoutes);
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const downgradeExpiredTrials = async () => {
  try {
    const result = await User.updateMany(
      {
        plan: PLAN_TYPES.TRIAL,
        trialEndsAt: { $lte: new Date() },
      },
      {
        $set: {
          plan: PLAN_TYPES.FREE,
          subscriptionStatus: "expired",
        },
      },
    );

    if (result.modifiedCount > 0) {
      console.log(`Downgraded ${result.modifiedCount} expired trial account(s).`);
    }
  } catch (error) {
    console.error("Expired trial downgrade job failed:", error);
  }
};

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
app.use("/api/analytics", analyticsRoutes);
app.use("/api/tickiai", aiRoutes);
app.use("/api/live-stream", liveStreamRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/private-events", privateEventRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/admin", adminRoutes);

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

app.get("/event/:id", async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return res.status(404).send("Event not found");
  }

  const title = escapeHtml(event.title);
  const description = escapeHtml(event.description || "");
  const image = escapeHtml(
    event.coverImage?.startsWith("http")
      ? event.coverImage
      : `${process.env.BACKEND_URL}/${event.coverImage || ""}`,
  );
  const eventId = escapeHtml(String(event._id));

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>

        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:url" content="https://tickispot.com/event/${eventId}" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${image}" />
      </head>

      <body>
        <script>
          window.location.href = "/event/${eventId}";
        </script>
      </body>
    </html>
  `);
});

app.get("/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).send("User not found");
  }

  const name = escapeHtml(user.name);
  const bio = escapeHtml(user.bio || "");
  const image = escapeHtml(user.avatar || user.profilePic || "");
  const userId = escapeHtml(String(user._id));

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${name}</title>

        <meta property="og:title" content="${name}" />
        <meta property="og:description" content="${bio}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:url" content="https://tickispot.com/users/${userId}" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${image}" />
      </head>

      <body>
        <script>
          window.location.href = "/users/${userId}";
        </script>
      </body>
    </html>
  `);
});

const server = http.createServer(app);
const io = buildSocketServer(server, { allowedOrigins: ALLOWED_ORIGINS });

app.set("io", io);

const PORT = process.env.PORT || 8080;
setInterval(downgradeExpiredTrials, 60 * 60 * 1000);
downgradeExpiredTrials();
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
