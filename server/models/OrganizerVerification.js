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
      enum: ["pending", "approved", "rejected", "resubmitted", "resubmission_required", "suspended", "under_investigation"],
      default: "pending",
    },
    rejectionReason: { type: String, default: "" },
    resubmissionInstructions: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    notes: { type: String, default: "" },
    
    // Risk assessment & fraud flags
    risk_score: { type: Number, default: 0, min: 0, max: 100 },
    verification_flags: { type: [String], default: [] }, // e.g., ["duplicate_id", "high_risk", "manual_review_needed"]
    
    // Submission metadata
    submission_ip: { type: String, default: "" },
    device_info: {
      userAgent: { type: String, default: "" },
      browser: { type: String, default: "" },
      os: { type: String, default: "" },
    },
    
    // Verification attempts tracking
    verification_attempts: {
      type: [
        {
          attemptNumber: Number,
          submittedAt: { type: Date, default: Date.now },
          documentCount: Number,
          status: String,
          notes: String,
        },
      ],
      default: [],
    },
    
    // Suspension/Investigation tracking
    suspension_reason: { type: String, default: "" },
    suspended_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    suspended_at: { type: Date, default: null },
    investigation_notes: { type: String, default: "" },
    
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
organizerVerificationSchema.index({ status: 1, createdAt: -1 }); // For filtering all pending/suspended/etc
organizerVerificationSchema.index({ risk_score: -1 }); // For risk-based sorting
organizerVerificationSchema.index({ suspended_at: 1 }); // For filtering suspended

module.exports = mongoose.model("OrganizerVerification", organizerVerificationSchema);
