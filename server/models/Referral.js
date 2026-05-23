/**
 * models/Referral.js
 *
 * Tracks WhatsApp/share referral clicks and ticket conversions.
 * New model — no existing models modified.
 */

const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    event: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Event",
      required: true,
      index:    true,
    },
    referrer: {
      type:  mongoose.Schema.Types.ObjectId,
      ref:   "User",
      default: null,
      index: true,
    },
    visitorId: {
      type:    String,
      default: "unknown",
    },
    source: {
      type:    String,
      enum:    ["whatsapp", "twitter", "facebook", "telegram", "copy", "other"],
      default: "whatsapp",
    },
    clicks:      { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    ticketsSold: { type: Number, default: 0 },
    totalRevenue:{ type: Number, default: 0 },
  },
  { timestamps: true }
);

referralSchema.index({ event: 1, referrer: 1, visitorId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Referral", referralSchema);