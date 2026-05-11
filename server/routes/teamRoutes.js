const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireFeature } = require("../middleware/requirePro");
const {
  getEventTeam,
  inviteTeamMember,
  getMyInvitations,
  respondToInvitation,
  removeTeamMember,
  updateTeamMemberRole,
  getMyTeamEvents,
} = require("../controllers/teamController");

const router = express.Router();

// Get team workspace (existing)
router.get("/", authMiddleware, requireFeature("TEAM_MEMBERS"), getMyTeamEvents);

// Event team management
router.get("/events/:eventId",  getEventTeam);
router.post("/events/:eventId/invite", authMiddleware, inviteTeamMember);
router.delete("/events/:eventId/members/:memberId", authMiddleware, removeTeamMember);
router.patch("/events/:eventId/members/:memberId/role", authMiddleware, updateTeamMemberRole);

// User invitations
router.get("/invitations", authMiddleware, getMyInvitations);
router.post("/invitations/:invitationId/respond", authMiddleware, respondToInvitation);

module.exports = router;
