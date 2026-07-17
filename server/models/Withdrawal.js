const mongoose = require("mongoose");

const withdrawalLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    status: { type: String, default: "PENDING_ADMIN_APPROVAL" },
    message: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const withdrawalAuditSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    note: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

/**
 * Withdrawal — organizer's request to move availableBalance to their bank.
 *
 * Lifecycle:
 *   PENDING_ADMIN_APPROVAL → PROCESSING → PAID
 *                         ↘ FAILED / REVERSED
 * Legacy states are still accepted for backward compatibility.
 *
 * A withdrawal can only be created when the organizer has sufficient
 * availableBalance. availableBalance only grows when a Payout is released.
 *
 * The link back to the Payout(s) that funded this withdrawal is recorded
 * in the Transaction that mirrors this withdrawal.
 */
const withdrawalSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount:    { type: Number, required: true },
    fee:       { type: Number, default: 0 },
    netAmount: { type: Number },

    paymentMethod: {
      type: String,
      enum: ["bank", "paystack", "flutterwave"],
      default: "bank",
    },

    bankDetails: {
      bankName:      String,
      accountNumber: String,
      accountName:   String,
      bankCode:      String,
    },

    paystackRecipientCode: { type: String },
    transferReference:     { type: String },
    paystackReference:     { type: String },
    webhookEventKeys: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "processing",
        "completed",
        "rejected",
        "failed",
        "PENDING_ADMIN_APPROVAL",
        "PROCESSING",
        "PAID",
        "FAILED",
        "REVERSED",
      ],
      default: "PENDING_ADMIN_APPROVAL",
      index: true,
    },

    failureReason: { type: String },

    processedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt:  { type: Date },

    /** Paystack webhook sets this when transfer is confirmed */
    completedAt:  { type: Date },

    logs: [withdrawalLogSchema],
    audit: [withdrawalAuditSchema],
  },
  { timestamps: true }
);

withdrawalSchema.index({ status: 1, createdAt: -1 });
withdrawalSchema.index({ organizer: 1, createdAt: -1 });
withdrawalSchema.index({ transferReference: 1 });
withdrawalSchema.index({ paystackReference: 1 });

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
