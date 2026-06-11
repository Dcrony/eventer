const mongoose = require("mongoose");

/**
 * Withdrawal — organizer's request to move availableBalance to their bank.
 *
 * Lifecycle:
 *   pending → approved (admin) → processing (Paystack) → completed
 *           ↘ rejected (admin)
 *           ↘ failed   (Paystack error)
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

    status: {
      type: String,
      enum: ["pending", "approved", "processing", "completed", "rejected", "failed"],
      default: "pending",
      index: true,
    },

    failureReason: { type: String },

    processedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt:  { type: Date },

    /** Paystack webhook sets this when transfer is confirmed */
    completedAt:  { type: Date },
  },
  { timestamps: true }
);

withdrawalSchema.index({ status: 1, createdAt: -1 });
withdrawalSchema.index({ organizer: 1, createdAt: -1 });

module.exports = mongoose.model("Withdrawal", withdrawalSchema);