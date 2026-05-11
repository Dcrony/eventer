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
      enum: ["co_organizer", "ticket_manager", "analytics_viewer", "livestream_moderator"],
      required: true,
      default: "co_organizer"
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
const getRolePermissions = (role) => {
  switch (role) {
    case "co_organizer":
      return {
        canEditEvent: true,
        canDeleteEvent: false,
        canManageTickets: true,
        canViewAnalytics: true,
        canManageLivestream: true,
        canViewTickets: true,
        canManageTeam: true,
      };

    case "ticket_manager":
      return {
        canEditEvent: false,
        canDeleteEvent: false,
        canManageTickets: true,
        canViewAnalytics: false,
        canManageLivestream: false,
        canViewTickets: true,
        canManageTeam: false,
      };

    case "analytics_viewer":
      return {
        canEditEvent: false,
        canDeleteEvent: false,
        canManageTickets: false,
        canViewAnalytics: true,
        canManageLivestream: false,
        canViewTickets: false,
        canManageTeam: false,
      };

    case "livestream_moderator":
      return {
        canEditEvent: false,
        canDeleteEvent: false,
        canManageTickets: false,
        canViewAnalytics: false,
        canManageLivestream: true,
        canViewTickets: false,
        canManageTeam: false,
      };

    default:
      return {};
  }
};

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

// Auto assign permissions from role
eventTeamMemberSchema.pre("save", function (next) {
  this.permissions = getRolePermissions(this.role);
  next();
});

module.exports = mongoose.model("EventTeam", eventTeamSchema);