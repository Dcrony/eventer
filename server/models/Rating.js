const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    // Reviewer info
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Target: either event or organizer
    targetType: {
      type: String,
      enum: ["event", "organizer"],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Event-specific context
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
      index: true,
    },

    // Organizer being rated
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Rating value 1-5 stars
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    // Review text
    review: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    // For organizer ratings: aspect ratings
    organizerAspects: {
      communication: { type: Number, min: 1, max: 5, default: null },
      professionalism: { type: Number, min: 1, max: 5, default: null },
      eventExecution: { type: Number, min: 1, max: 5, default: null },
      valueForMoney: { type: Number, min: 1, max: 5, default: null },
    },

    // For event ratings: aspect ratings
    eventAspects: {
      experience: { type: Number, min: 1, max: 5, default: null },
      venue: { type: Number, min: 1, max: 5, default: null },
      organization: { type: Number, min: 1, max: 5, default: null },
      valueForMoney: { type: Number, min: 1, max: 5, default: null },
    },

    // Ticket context: did reviewer actually attend?
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      default: null,
    },
    wasAttendee: {
      type: Boolean,
      default: false,
    },

    // Moderation
    isVisible: {
      type: Boolean,
      default: true,
      index: true,
    },
    flaggedAt: {
      type: Date,
      default: null,
    },
    flagReason: {
      type: String,
      default: "",
    },

    // Helpfulness votes
    helpful: {
      type: Number,
      default: 0,
    },
    unhelpful: {
      type: Number,
      default: 0,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
ratingSchema.index({ targetType: 1, targetId: 1, isVisible: 1, createdAt: -1 });
ratingSchema.index({ organizer: 1, targetType: 1, isVisible: 1 });
ratingSchema.index({ event: 1, isVisible: 1 });
ratingSchema.index({ reviewer: 1, targetType: 1 });

module.exports = mongoose.model("Rating", ratingSchema);
