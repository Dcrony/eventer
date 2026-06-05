const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    // Reporter
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // What is being reported
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

    // Related event (if applicable)
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },

    // Organizer being reported (if targetType="organizer")
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Reason for report
    reason: {
      type: String,
      enum: [
        "spam",
        "inappropriate_content",
        "fraud",
        "unsafe_event",
        "false_information",
        "copyright",
        "harassment",
        "other",
      ],
      required: true,
      index: true,
    },

    // Detailed description
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // Moderation status
    status: {
      type: String,
      enum: ["open", "investigating", "resolved", "rejected"],
      default: "open",
      index: true,
    },

    // Resolution
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: "",
    },

    // Action taken (if any)
    actionTaken: {
      type: String,
      enum: ["none", "warning", "content_removed", "account_suspended", "account_banned"],
      default: "none",
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

// Compound indexes
reportSchema.index({ targetType: 1, targetId: 1, status: 1 });
reportSchema.index({ reporter: 1, createdAt: -1 });
reportSchema.index({ organizer: 1, status: 1 });
reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
