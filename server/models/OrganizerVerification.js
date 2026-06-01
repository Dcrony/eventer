const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g. national_id, passport, cac
    url: { type: String, required: true },
    publicId: { type: String },
    filename: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const organizerVerificationSchema = new mongoose.Schema(
  {
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    documents: { type: [documentSchema], default: [] },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "resubmitted"],
      default: "pending",
    },
    rejectionReason: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    notes: { type: String, default: "" },
    // basic computed trust metrics snapshot at time of submission
    metricsSnapshot: {
      eventsCompleted: { type: Number, default: 0 },
      totalTicketsSold: { type: Number, default: 0 },
      accountAgeDays: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

organizerVerificationSchema.index({ organizer: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("OrganizerVerification", organizerVerificationSchema);
