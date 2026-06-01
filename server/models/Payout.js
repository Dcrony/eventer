const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: false },
    tickets: { type: [mongoose.Schema.Types.ObjectId], ref: "Ticket", default: [] },
    grossAmount: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    state: {
      type: String,
      enum: ["pending", "under_review", "scheduled", "released", "frozen", "refunded", "disputed"],
      default: "pending",
    },
    releaseDate: { type: Date, default: null },
    reason: { type: String, default: "" },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    processedAt: { type: Date, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    audit: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

payoutSchema.index({ organizer: 1, state: 1, createdAt: -1 });

module.exports = mongoose.model("Payout", payoutSchema);
