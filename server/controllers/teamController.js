const Event = require("../models/Event");
const EventTeam = require("../models/EventTeam");
const TeamInvitation = require("../models/TeamInvitation");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService");
const sendEmail = require("../utils/email");
const { teamInvitationEmail } = require("../utils/emailTemplates");

// Helper function to check if user can manage team for an event
const canManageTeam = async (eventId, userId) => {
  const event = await Event.findById(eventId);
  if (!event) return false;

  // Owner can always manage team
  const ownerId = event.createdBy?._id || event.createdBy;

if (String(ownerId) === String(userId)) {
  return true;
}

  // Check if user is a team co_organizer
  const eventTeam = await EventTeam.findOne({ event: eventId });
  if (!eventTeam) return false;

  const member = eventTeam.members.find(m =>
    String(m.user) === String(userId) && m.isActive
  );

  return member && member.permissions.canManageTeam;
};

// // Helper function to check if user has access to event
// const hasEventAccess = async (eventId, userId, requiredPermission = null) => {
//   const event = await Event.findById(eventId);

//   if (!event) return false;

//   // Owner has full access
//   const ownerId = event.createdBy?._id || event.createdBy;

//   if (String(ownerId) === String(userId)) {
//     return true;
//   }

//   // Check team membership
//   const eventTeam = await EventTeam.findOne({
//     event: eventId,
//   }).populate("members.user");

//   if (!eventTeam) {
//     return false;
//   }

//   const member = eventTeam.members.find(
//     (m) =>
//       String(m.user?._id || m.user) === String(userId) &&
//       m.isActive
//   );

//   if (!member) {
//     return false;
//   }

//   // If no specific permission required
//   if (!requiredPermission) {
//     return true;
//   }

//   return member.permissions?.[requiredPermission] === true;
// };

// Get team members for an event
exports.getEventTeam = async (req, res) => {
  try {
    const { eventId } = req.params;

    const eventTeam = await EventTeam.findOne({ event: eventId })
      .populate("members.user", "name username email profilePic isVerified")
      .populate("members.invitedBy", "name username");

    if (!eventTeam) {
      return res.json({ members: [] });
    }

   res.json({
  members: eventTeam.members
    .filter(member => member.isActive)
    .map(member => ({
      id: member._id,
      user: member.user,
      role: member.role,
      permissions: member.permissions,
      invitedBy: member.invitedBy,
      joinedAt: member.joinedAt,
      isActive: member.isActive,
    }))
});

  } catch (error) {
    console.error("Get event team error:", error);
    res.status(500).json({ message: "Failed to load team" });
  }
};

// Invite team member
exports.inviteTeamMember = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email, role, message } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!email || !role) {
      return res.status(400).json({ message: "Email and role are required" });
    }

    const validRoles = ["co_organizer", "ticket_manager", "analytics_viewer", "livestream_moderator"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if user can manage team
    if (!await canManageTeam(eventId, userId)) {
      return res.status(403).json({ message: "You don't have permission to manage team" });
    }

    // Get event details
    const event = await Event.findById(eventId).populate("createdBy", "name username");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Find user by email
    const invitee = await User.findOne({ email: email.toLowerCase() });
    if (!invitee) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Check if user is already invited or on team
    const existingInvitation = await TeamInvitation.findOne({
      event: eventId,
      invitee: invitee._id,
      status: "pending"
    });

    if (existingInvitation) {
      return res.status(400).json({ message: "User already has a pending invitation" });
    }

    // Check if user is already on team
    const eventTeam = await EventTeam.findOne({ event: eventId });
    if (eventTeam) {
      const existingMember = eventTeam.members.find(m =>
        String(m.user) === String(invitee._id) && m.isActive
      );
      if (existingMember) {
        return res.status(400).json({ message: "User is already on the team" });
      }
    }

    // Create invitation
    const invitation = await TeamInvitation.create({
      event: eventId,
      inviter: userId,
      invitee: invitee._id,
      email: email.toLowerCase(),
      role,
      message: message || "",
    });

    // Send email invitation
    try {
      const emailHtml = teamInvitationEmail(
        invitee.name || invitee.username,
        event.title,
        role,
        `${process.env.FRONTEND_URL}/team/invitations`
      );

      await sendEmail({
        to: email,
        subject: `You're invited to join the team for "${event.title}"`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Failed to send team invitation email:", emailError);
      // Don't fail the invitation if email fails
    }

    // Send in-app notification
    await createNotification(req.app, {
      userId: invitee._id,
      type: "team_invitation",
      message: `You've been invited to join the team for "${event.title}" as ${role.replace("_", " ")}`,
      actionUrl: "/team/invitations",
      entityId: invitation._id,
      entityType: "team_invitation",
    });

    res.status(201).json({
      message: "Team invitation sent successfully",
      invitation: {
        id: invitation._id,
        email,
        role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      }
    });

  } catch (error) {
    console.error("Invite team member error:", error);
    res.status(500).json({ message: "Failed to send invitation" });
  }
};

// Get user's team invitations
exports.getMyInvitations = async (req, res) => {
  try {
    const userId = req.user.id;

    const invitations = await TeamInvitation.find({
      invitee: userId,
      status: "pending"
    })
    .populate("event", "title description image startDate category")
    .populate("inviter", "name username profilePic")
    .sort({ createdAt: -1 });

    res.json({
      invitations: invitations.map(inv => ({
        id: inv._id,
        event: inv.event,
        inviter: inv.inviter,
        role: inv.role,
        message: inv.message,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
      }))
    });

  } catch (error) {
    console.error("Get my invitations error:", error);
    res.status(500).json({ message: "Failed to load invitations" });
  }
};

// Respond to team invitation
exports.respondToInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { action } = req.body; // "accept" or "decline"
    const userId = req.user.id;

    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const invitation = await TeamInvitation.findOne({
      _id: invitationId,
      invitee: userId,
      status: "pending"
    }).populate("event");

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    // Check if invitation expired
    if (new Date() > invitation.expiresAt) {
      invitation.status = "expired";
      await invitation.save();
      return res.status(400).json({ message: "Invitation has expired" });
    }

    if (action === "decline") {
      invitation.status = "declined";
      await invitation.save();

      // Notify inviter
      await createNotification(req.app, {
        userId: invitation.inviter,
        type: "team_invitation_declined",
        message: `${req.user.name || req.user.username} declined the team invitation for "${invitation.event.title}"`,
        actionUrl: `/events/${invitation.event._id}/team`,
        entityId: invitation._id,
        entityType: "team_invitation",
      });

      return res.json({ message: "Invitation declined" });
    }

    // Accept invitation
    invitation.status = "accepted";
    await invitation.save();

    // Add user to event team
    let eventTeam = await EventTeam.findOne({ event: invitation.event._id });
    if (!eventTeam) {
      eventTeam = await EventTeam.create({ event: invitation.event._id, members: [] });
      // Update event with team reference
      await Event.findByIdAndUpdate(invitation.event._id, { team: eventTeam._id });
    }

    // Check if user is already on team (shouldn't happen, but safety check)
    const existingMember = eventTeam.members.find(m =>
      String(m.user) === String(userId) && m.isActive
    );

    if (!existingMember) {
      eventTeam.members.push({
        user: userId,
        role: invitation.role,
        invitedBy: invitation.inviter,
        joinedAt: new Date(),
        isActive: true,
      });
      await eventTeam.save();
    }

    // Notify inviter
    await createNotification(req.app, {
      userId: invitation.inviter,
      type: "team_invitation_accepted",
      message: `${req.user.name || req.user.username} accepted the team invitation for "${invitation.event.title}"`,
      actionUrl: `/events/${invitation.event._id}/team`,
      entityId: invitation._id,
      entityType: "team_invitation",
    });

    res.json({
      message: "Successfully joined the team",
      eventId: invitation.event._id,
      role: invitation.role
    });

  } catch (error) {
    console.error("Respond to invitation error:", error);
    res.status(500).json({ message: "Failed to respond to invitation" });
  }
};

// Remove team member
exports.removeTeamMember = async (req, res) => {
  try {
    const { eventId, memberId } = req.params;
    const userId = req.user.id;

    // Check if user can manage team
    if (!await canManageTeam(eventId, userId)) {
      return res.status(403).json({ message: "You don't have permission to manage team" });
    }

    const eventTeam = await EventTeam.findOne({ event: eventId });
    if (!eventTeam) {
      return res.status(404).json({ message: "Team not found" });
    }

    const memberIndex = eventTeam.members.findIndex(
  m => String(m._id) === String(memberId) && m.isActive
);
    if (memberIndex === -1) {
      return res.status(404).json({ message: "Team member not found" });
    }

    const member = eventTeam.members[memberIndex];

    // Cannot remove owner
    const event = await Event.findById(eventId);
    if (String(member.user) === String(event.createdBy)) {
      return res.status(400).json({ message: "Cannot remove event owner from team" });
    }

    // Mark member as inactive
    eventTeam.members[memberIndex].isActive = false;
    await eventTeam.save();

    // Notify removed member
    await createNotification(req.app, {
      userId: member.user,
      type: "team_member_removed",
      message: `You have been removed from the team for "${event.title}"`,
      actionUrl: "/dashboard",
      entityId: eventId,
      entityType: "event",
    });

    res.json({ message: "Team member removed successfully" });

  } catch (error) {
    console.error("Remove team member error:", error);
    res.status(500).json({ message: "Failed to remove team member" });
  }
};

// Update team member role
exports.updateTeamMemberRole = async (req, res) => {
  try {
    const { eventId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user.id;

    const validRoles = ["co_organizer", "ticket_manager", "analytics_viewer", "livestream_moderator"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if user can manage team
    if (!await canManageTeam(eventId, userId)) {
      return res.status(403).json({ message: "You don't have permission to manage team" });
    }

    const eventTeam = await EventTeam.findOne({ event: eventId });
    if (!eventTeam) {
      return res.status(404).json({ message: "Team not found" });
    }

    const member = eventTeam.members.find(
  m => String(m._id) === String(memberId) && m.isActive
);

if (!member) {
  return res.status(404).json({
    message: "Active team member not found"
  });
}
    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }

    member.role = role;
    await eventTeam.save();

    // Notify member of role change
    const event = await Event.findById(eventId);
    await createNotification(req.app, {
      userId: member.user,
      type: "team_role_updated",
      message: `Your role has been updated to ${role.replace("_", " ")} for "${event.title}"`,
      actionUrl: `/events/${eventId}`,
      entityId: eventId,
      entityType: "event",
    });

    res.json({
      message: "Team member role updated successfully",
      member: {
        id: member._id,
        role: member.role,
        permissions: member.permissions,
      }
    });

  } catch (error) {
    console.error("Update team member role error:", error);
    res.status(500).json({ message: "Failed to update team member role" });
  }
};

// Get events user has team access to
exports.getMyTeamEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    const eventTeams = await EventTeam.find({
  members: {
    $elemMatch: {
      user: userId,
      isActive: true
    }
  }
})
    .populate("event")
    .populate("members.user", "name username");

    const events = eventTeams.map(et => {
      const member = et.members.find(
  m =>
    String(m.user._id || m.user) === String(userId) &&
    m.isActive
);
      return {
        ...et.event.toObject(),
        teamRole: member.role,
        teamPermissions: member.permissions,
      };
    });

    res.json({ events });

  } catch (error) {
    console.error("Get my team events error:", error);
    res.status(500).json({ message: "Failed to load team events" });
  }
};