import API from "../../api/axios";

const teamService = {
  // Get user's team events
  getMyTeamEvents: () => {
    return API.get("/team", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  },

  // Get event team members
  getEventTeam: (eventId) => {
    return API.get(`/team/events/${eventId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  },

  // Invite team member
  inviteTeamMember: (eventId, data) => {
    return API.post(`/team/events/${eventId}/invite`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  },

  // Get user's invitations
  getMyInvitations: () => {
    return API.get("/team/invitations", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  },

  // Respond to invitation
  respondToInvitation: (invitationId, action) => {
    return API.post(`/team/invitations/${invitationId}/respond`, { action }, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  },

  // Remove team member
  removeTeamMember: (eventId, memberId) => {
    return API.delete(`/team/events/${eventId}/members/${memberId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  },

  // Update team member role
  updateTeamMemberRole: (eventId, memberId, role) => {
    return API.patch(`/team/events/${eventId}/members/${memberId}/role`, { role }, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  },
};

export default teamService;