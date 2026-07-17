const mongoose = require("mongoose");

const auditEntrySchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    note: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const payoutLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    status: { type: String, default: "PENDING" },
    message: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
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
    grossAmount: { type: Number, default: 0, min: 0 },
    platformFee: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, default: 0, min: 0 },
    amount: { type: Number, default: 0, min: 0 },
    payoutType: {
      type: String,
      enum: ["EARLY", "FINAL"],
      default: "FINAL",
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "PAID", "FAILED", "REVERSED"],
      default: "PENDING",
      index: true,
    },
    state: {
      type: String,
      enum: ["pending", "processing", "under_review", "scheduled", "released", "completed", "frozen", "refunded"],
      default: "pending",
      index: true,
    },
    transactionReference: { type: String, default: "" },
    paymentProviderReference: { type: String, default: "" },
    releaseAfter: {
      type: Date,
      default: null,
      index: true,
    },
    reason: { type: String },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },
    audit: [auditEntrySchema],
    logs: [payoutLogSchema],
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

payoutSchema.index({ state: 1, releaseAfter: 1 });
payoutSchema.index({ organizer: 1, state: 1 });

module.exports = mongoose.model("Payout", payoutSchema);
