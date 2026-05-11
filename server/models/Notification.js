const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "system",
        "event",
        "ticket",
        "ticket_purchase",
        "message",
        "custom",
        "like",
        "follow",
        "comment",
        "reply",
        "announcement",
        "payout_account_connected",
    "payout_account_updated",
    "payout_account_disconnected",
    'withdrawal_requested',
    'withdrawal_completed',
    'withdrawal_failed',
    'team_invitation',
'team_invitation_accepted',
'team_invitation_declined',
'team_member_removed',
'team_role_updated',
    'livestream_started',
    'livestream_ended',
      ],
      default: "system",
    },
    actionUrl: {
      type: String,
      default: null,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    entityType: {
      type: String,
      default: null,
    },
    announcementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Announcement",
      default: null,
    },
    isAnnouncement: {
      type: Boolean,
      default: false,
      index: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

notificationSchema.virtual("read")
  .get(function getRead() {
    return this.isRead;
  })
  .set(function setRead(value) {
    this.isRead = value;
  });

module.exports = mongoose.model("Notification", notificationSchema);
