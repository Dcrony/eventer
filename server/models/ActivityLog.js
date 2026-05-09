const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "USER_SUSPENDED",
        "USER_ACTIVATED",
        "USER_DELETED",
        "USER_ROLE_CHANGED",
        "EVENT_APPROVED",
        "EVENT_REJECTED",
        "EVENT_EDITED",
        "EVENT_DELETED",
        "EVENT_FEATURED",
        "ANNOUNCEMENT_SENT",
        "SETTING_CHANGED",
        "FEATURE_TOGGLED",
      ],
      required: true,
    },
    targetType: {
      type: String,
      enum: ["User", "Event", "Announcement", "Setting", "Other"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    details: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
