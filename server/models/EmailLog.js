const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "general",
        "donation_appreciation",
        "donation_admin_notification",
        "subscription_confirmation",
        "subscription_admin_notification",
        "ticket",
        "welcome",
        "otp",
        "password_reset",
      ],
      default: "general",
    },
    recipient: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    provider: {
      type: String,
      default: "resend",
    },
    providerId: String,
    error: String,
    attempts: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: Date,
    relatedType: String,
    relatedId: mongoose.Schema.Types.Mixed,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmailLog", emailLogSchema);
