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
  { _id: true },
);

const eventDailyMetricSchema = new mongoose.Schema(
  {
    dateKey: {
      type: String,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    ticketsSold: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String,

  startDate: Date,
  startTime: String,
  endDate: Date,
  endTime: String,

  location: String,
  image: String,

  pricing: [
    {
      type: { type: String, required: true },
      price: { type: Number, default: 0 },
    },
  ],
  isFree: {
    type: Boolean,
    default: false,
  },
  isFreeEvent: {
    type: Boolean,
    default: false,
  },

  totalTickets: Number,
  ticketsSold: {
    type: Number,
    default: 0,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  shareCount: {
    type: Number,
    default: 0,
  },
  likes: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
  comments: {
    type: [eventCommentSchema],
    default: [],
  },
  analytics: {
    daily: {
      type: [eventDailyMetricSchema],
      default: [],
    },
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

  liveStream: {
    isLive: { type: Boolean, default: false },
    streamType: { type: String, enum: ["YouTube", "Facebook", "Custom", "Camera"] },
    streamURL: String,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

eventSchema.pre("validate", function syncFreeFlags(next) {
  const isMarkedFree = this.isFree === true || this.isFreeEvent === true;
  this.isFree = isMarkedFree;
  this.isFreeEvent = isMarkedFree;

  if (isMarkedFree) {
    this.pricing = [{ type: "Free", price: 0 }];
  }

  next();
});

module.exports = mongoose.model("Event", eventSchema);
