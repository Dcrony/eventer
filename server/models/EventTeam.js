const mongoose = require("mongoose");

const eventTeamMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["manager", "ticket_manager", "analytics_viewer", "livestream_moderator"],
      required: true,
    },
    permissions: {
      // Core permissions
      canEditEvent: { type: Boolean, default: false },
      canDeleteEvent: { type: Boolean, default: false },
      canManageTickets: { type: Boolean, default: false },
      canViewAnalytics: { type: Boolean, default: false },
      canManageLivestream: { type: Boolean, default: false },
      canViewTickets: { type: Boolean, default: false },
      canManageTeam: { type: Boolean, default: false },
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

// Set permissions based on role
eventTeamMemberSchema.pre("save", function(next) {
  switch (this.role) {
    case "manager":
      this.permissions = {
        canEditEvent: true,
        canDeleteEvent: false, // Only owner can delete
        canManageTickets: true,
        canViewAnalytics: true,
        canManageLivestream: true,
        canViewTickets: true,
        canManageTeam: true,
      };
      break;
    case "ticket_manager":
      this.permissions = {
        canEditEvent: false,
        canDeleteEvent: false,
        canManageTickets: true,
        canViewAnalytics: false,
        canManageLivestream: false,
        canViewTickets: true,
        canManageTeam: false,
      };
      break;
    case "analytics_viewer":
      this.permissions = {
        canEditEvent: false,
        canDeleteEvent: false,
        canManageTickets: false,
        canViewAnalytics: true,
        canManageLivestream: false,
        canViewTickets: false,
        canManageTeam: false,
      };
      break;
    case "livestream_moderator":
      this.permissions = {
        canEditEvent: false,
        canDeleteEvent: false,
        canManageTickets: false,
        canViewAnalytics: false,
        canManageLivestream: true,
        canViewTickets: false,
        canManageTeam: false,
      };
      break;
  }
  next();
});

const eventTeamSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      unique: true,
    },
    members: [eventTeamMemberSchema],
  },
  { timestamps: true }
);

// Index for efficient queries
eventTeamSchema.index({ event: 1 });

module.exports = mongoose.model("EventTeam", eventTeamSchema);