const mongoose = require("mongoose");

const eventCommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const eventDailyMetricSchema = new mongoose.Schema(
  {
    dateKey: { type: String, required: true },
    views:       { type: Number, default: 0 },
    likes:       { type: Number, default: 0 },
    comments:    { type: Number, default: 0 },
    shares:      { type: Number, default: 0 },
    ticketsSold: { type: Number, default: 0 },
    revenue:     { type: Number, default: 0 },
  },
  { _id: false }
);

/* ─── Pricing tier schema ─────────────────────────────────────────────────── */
const pricingTierSchema = new mongoose.Schema(
  {
    // Core
    type:  { type: String, required: true },   // "Regular" | "VIP" | "VVIP" | custom
    price: { type: Number, default: 0 },

    // Per-tier controls (NEW)
    isEnabled: { type: Boolean, default: true },   // false → hidden everywhere
    isFree:    { type: Boolean, default: false },  // tier-level free override

    // Customisation (NEW)
    label:       { type: String, default: "" },    // display name override
    color:       { type: String, default: "" },    // hex / tailwind token
    description: { type: String, default: "" },    // short benefit text
    maxPerOrder: { type: Number, default: 0 },     // 0 = unlimited
  },
  { _id: false }
);

/* ─── Event schema ────────────────────────────────────────────────────────── */
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required() { return this.isDraft !== true; },
    default: "",
  },
  description: String,
  category:    String,

  startDate: Date,
  startTime: String,
  endDate:   Date,
  endTime:   String,

  location: String,
  image:    String,

  pricing: { type: [pricingTierSchema], default: [] },

  isFree:      { type: Boolean, default: false },
  isFreeEvent: { type: Boolean, default: false },

  totalTickets: Number,
  ticketsSold:  { type: Number, default: 0 },
  capacity:     { type: Number, default: 0 },

  viewCount:  { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },

  likes: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
  comments: { type: [eventCommentSchema], default: [] },

  analytics: {
    daily: { type: [eventDailyMetricSchema], default: [] },
  },

  eventType: {
    type: String,
    enum: ["In-person", "Virtual", "Hybrid"],
    default: "In-person",
  },
  visibility: {
    type: String,
    enum: ["public", "private"],
    default: "public",
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "suspended"],
    default: "pending",
  },

  isDraft:          { type: Boolean, default: false },
  draftStep:        { type: Number,  default: 1 },
  draftUpdatedAt:   { type: Date,    default: null },
  draftTeamMembers: [
    {
      email: { type: String, trim: true },
      role:  { type: String, trim: true, default: "Viewer" },
    },
  ],

  isFeatured:   { type: Boolean, default: false },
  reviewReason: { type: String,  default: "" },
  reviewedAt:   { type: Date,    default: null },
  reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  liveStream: {
    isLive:     { type: Boolean, default: false },
    streamType: { type: String, enum: ["YouTube", "Facebook", "Custom", "Camera"] },
    streamURL:  String,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EventTeam",
    default: null,
  },

  createdAt: { type: Date, default: Date.now },
});

/* ─── Indexes ─────────────────────────────────────────────────────────────── */
eventSchema.index({ status: 1, createdAt: -1 });
eventSchema.index({ createdBy: 1, createdAt: -1 });
eventSchema.index({ createdBy: 1, isDraft: 1, draftUpdatedAt: -1 });
eventSchema.index({ "liveStream.isLive": 1, startDate: 1 });

/* ─── Pre-validate hook ───────────────────────────────────────────────────── */
eventSchema.pre("validate", function syncFreeFlags(next) {
  const isMarkedFree = this.isFree === true || this.isFreeEvent === true;
  this.isFree      = isMarkedFree;
  this.isFreeEvent = isMarkedFree;

  if (isMarkedFree) {
    this.pricing = [{ type: "Free", price: 0, isEnabled: true, isFree: true }];
  }

  next();
});

module.exports = mongoose.model("Event", eventSchema);