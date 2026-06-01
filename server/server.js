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
const referralRoutes = require("./routes/referralRoutes");
const privateEventRoutes = require("./routes/privateEventRoutes");
const adminRoutes = require("./routes/adminRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const payoutRoutes = require("./routes/payoutRoutes");
const User = require("./models/User");
const Event = require("./models/Event");
const { PLAN_TYPES } = require("./services/subscriptionService");
const { buildSocketServer } = require("./socket");
const { bootstrapAdmin } = require("./utils/bootstrapAdmin");
const ogRoutes = require("./routes/ogRoutes");

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


app.use(ogRoutes);

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
  .then(async () => {
    console.log("MongoDB connected");

    if (process.env.BOOTSTRAP_ADMIN_ON_START === "true") {
      const email = process.env.ADMIN_EMAIL;
      const password = process.env.ADMIN_PASSWORD;
      if (!email || !password) {
        console.warn("BOOTSTRAP_ADMIN_ON_START is set but ADMIN_EMAIL or ADMIN_PASSWORD is missing.");
        return;
      }
      try {
        const result = await bootstrapAdmin({
          email,
          password,
          name: process.env.ADMIN_NAME || "Admin User",
          username: process.env.ADMIN_USERNAME || "tickispotadmin",
          phone: process.env.ADMIN_PHONE,
        });
        console.log(
          result.created
            ? `Admin bootstrap: created ${result.email}`
            : `Admin bootstrap: promoted ${result.email}`,
        );
      } catch (error) {
        console.error("Admin bootstrap failed:", error.message);
      }
    }
  })
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

// ── Payout release worker ──
const runPayoutReleaseWorker = async () => {
  try {
    const PlatformSetting = require("./models/PlatformSetting");
    const Payout = require("./models/Payout");
    const Event = require("./models/Event");
    const User = require("./models/User");
    const payoutQueue = require("./queues/payoutQueue");
    const fraudService = require("./utils/fraudService");

    let settings = await PlatformSetting.findOne({ key: "platform" });
    if (!settings) {
      settings = await PlatformSetting.create({ key: "platform" });
    }
    const payoutCfg = settings.payouts || {};
    const intervalMinutes = Number(payoutCfg.autoReleaseIntervalMinutes || 15);
    const maxBatch = Number(payoutCfg.maxAutoReleaseBatch || 50);
    const requireVerified = Boolean(payoutCfg.requireOrganizerVerified);
    const requireEventComplete = Boolean(payoutCfg.requireEventCompletion);
    const cooldownDays = Number(payoutCfg.cooldownDaysAfterEvent || 0);

    const now = new Date();

    // Find eligible payouts in pending or scheduled state
    const filter = { state: { $in: ["pending", "scheduled"] } };
    const candidates = await Payout.find(filter).sort({ createdAt: 1 }).limit(maxBatch).lean();

    for (const p of candidates) {
      try {
        // skip if already scheduled for future release
        if (p.releaseDate && new Date(p.releaseDate) > now) continue;

        // organizer checks
        const organizer = await User.findById(p.organizer).lean();
        if (!organizer) continue;
        if (organizer.isSuspended || organizer.isDeleted) continue;
        if (requireVerified && !organizer.isVerified) continue;

        // event completion rule
        if (requireEventComplete && p.event) {
          const event = await Event.findById(p.event).lean();
          if (!event) continue;
          const eventEnd = event.endDate || event.startDate || null;
          if (!eventEnd) continue; // cannot auto-release without event end
          const releaseAfter = new Date(eventEnd);
          releaseAfter.setDate(releaseAfter.getDate() + cooldownDays);
          if (now < releaseAfter) continue;
        }

        // basic fraud assessment
        const risk = await fraudService.assessPayoutRisk(p);
        if (risk.value >= 50) {
          // escalate to manual review
          await require("./models/Payout").findByIdAndUpdate(p._id, { $set: { state: "under_review", reason: `flagged_by_worker: ${risk.reasons.join(",")}` }, $push: { audit: { actor: null, action: "flagged_under_review", note: risk.reasons.join(","), at: new Date() } } });
          console.log(`Payout ${p._id} flagged for review (risk=${risk.value})`);
          continue;
        }

        // enqueue release job
        await payoutQueue.add({ type: "release", payoutId: p._id, actorId: null, note: "auto-release worker" }, { attempts: 5, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true });
        console.log(`Payout ${p._id} enqueued for auto-release`);
      } catch (e) {
        console.error("Payout worker failed for payout", p._id, e.message || e);
      }
    }
  } catch (error) {
    console.error("Payout release worker error:", error);
  }
};

// Schedule worker with interval from settings (fallback 15 minutes)
setInterval(async () => {
  try {
    await runPayoutReleaseWorker();
  } catch (e) {
    console.error("Payout worker loop error:", e.message || e);
  }
}, 15 * 60 * 1000);

// Run immediately at startup as well
runPayoutReleaseWorker();

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
app.use("/api/referrals", referralRoutes);
app.use("/api/private-events", privateEventRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/payouts", payoutRoutes);

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
setInterval(downgradeExpiredTrials, 60 * 60 * 1000);
downgradeExpiredTrials();
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
