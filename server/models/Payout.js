const mongoose = require("mongoose");

/**
 * Payout — escrow record for a single ticket-sale revenue block.
 *
 * Lifecycle:
 *   pending → under_review → scheduled → released → completed
 *                         ↘ frozen
 *                         ↘ refunded
 *
 * A Payout is created the moment a ticket is sold.
 * It stays in escrow until:
 *   1. The event has ended (enforced via releaseAfter)
 *   2. The organizer is verified
 *   3. An admin releases it (or the cron job auto-releases)
 *
 * Once released, the organizer's availableBalance increases by netAmount.
 * The organizer can then request a Withdrawal.
 */
const auditEntrySchema = new mongoose.Schema(
  {
    actor:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    note:   { type: String },
    at:     { type: Date, default: Date.now },
  },
  { _id: false }
);

const payoutSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    tickets: [{ type: mongoose.Schema.Types.ObjectId }],

    grossAmount: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, required: true, min: 0 },
    netAmount:   { type: Number, required: true, min: 0 },

    state: {
      type: String,
      enum: ["pending", "under_review", "scheduled", "released", "completed", "frozen", "refunded"],
      default: "pending",
      index: true,
    },

    /**
     * The earliest date this payout may be released.
     * Set to the event's endDate when the Payout is created.
     * The auto-release cron will only process payouts where:
     *   releaseAfter <= now AND state === "pending"
     */
    releaseAfter: {
      type: Date,
      required: true,
      index: true,
    },

    reason:      { type: String },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },

    audit: [auditEntrySchema],

    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

payoutSchema.index({ state: 1, releaseAfter: 1 }); // for cron queries
payoutSchema.index({ organizer: 1, state: 1 });

module.exports = mongoose.model("Payout", payoutSchema);