const mongoose = require("mongoose");

const teamInvitationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    inviter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["manager", "ticket_manager", "analytics_viewer", "livestream_moderator"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired"],
      default: "pending",
    },
    message: {
      type: String,
      maxlength: 500,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    respondedAt: Date,
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
teamInvitationSchema.index({ event: 1, invitee: 1 });
teamInvitationSchema.index({ invitee: 1, status: 1 });
teamInvitationSchema.index({ expiresAt: 1 });

// Auto-expire invitations
teamInvitationSchema.pre("save", function(next) {
  if (this.isModified("status") && (this.status === "accepted" || this.status === "declined")) {
    this.respondedAt = new Date();
  }
  next();
});

module.exports = mongoose.model("TeamInvitation", teamInvitationSchema);