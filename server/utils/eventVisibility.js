const Event = require("../models/Event");
const EventTeam = require("../models/EventTeam");
const Ticket = require("../models/Ticket");

const normalizeVisibility = (value) =>
  String(value || "public").trim().toLowerCase() === "private" ? "private" : "public";

const isApprovedEvent = (event) => !event?.status || event.status === "approved";

const isPublicEvent = (event) =>
  normalizeVisibility(event?.visibility) === "public" && isApprovedEvent(event);

const buildPublicEventQuery = (extra = {}) => {
  const query = { ...extra };
  const existingAnd = Array.isArray(query.$and) ? [...query.$and] : [];
  delete query.$and;

  return {
    ...query,
    $and: [
      ...existingAnd,
      {
        $or: [{ visibility: { $exists: false } }, { visibility: "public" }],
      },
      {
        $or: [{ status: { $exists: false } }, { status: "approved" }],
      },
    ],
  };
};

const getViewerId = (viewerOrId) => {
  const value = viewerOrId?.id || viewerOrId?._id || viewerOrId;
  return value ? String(value) : null;
};

const isEventOwner = (event, viewerId) =>
  Boolean(viewerId) && String(event?.createdBy?._id || event?.createdBy || "") === String(viewerId);

const getActiveTeamMember = async (eventId, viewerId) => {
  if (!eventId || !viewerId) return null;

  const eventTeam = await EventTeam.findOne({
    event: eventId,
    members: {
      $elemMatch: {
        user: viewerId,
        isActive: true,
      },
    },
  }).select("members");

  return (
    eventTeam?.members?.find(
      (member) =>
        member?.isActive &&
        String(member.user?._id || member.user) === String(viewerId),
    ) || null
  );
};

const isAttendeeForEvent = async (eventId, viewerId) => {
  if (!eventId || !viewerId) return false;

  const existingTicket = await Ticket.exists({
    event: eventId,
    buyer: viewerId,
    status: { $ne: "refunded" },
  });

  return Boolean(existingTicket);
};

const canViewEvent = async (eventOrId, viewerOrId, options = {}) => {
  let event = eventOrId;
  if (!event?._id) {
    event = await Event.findById(eventOrId).populate("createdBy", "_id role");
  }

  if (!event) {
    return {
      allowed: false,
      event: null,
      reason: "not_found",
      isOwner: false,
      isAdmin: false,
      isCollaborator: false,
      isAttendee: false,
      member: null,
    };
  }

  const viewerId = getViewerId(viewerOrId);
  const isAdmin = viewerOrId?.role === "admin";
  const isOwner = isEventOwner(event, viewerId);
  const approved = isApprovedEvent(event);
  const visibility = normalizeVisibility(event.visibility);

  if (isAdmin || isOwner) {
    return {
      allowed: true,
      event,
      reason: isAdmin ? "admin" : "owner",
      isOwner,
      isAdmin,
      isCollaborator: false,
      isAttendee: false,
      member: null,
    };
  }

  if (approved && visibility === "public") {
    return {
      allowed: true,
      event,
      reason: "public",
      isOwner: false,
      isAdmin,
      isCollaborator: false,
      isAttendee: false,
      member: null,
    };
  }

  let member = null;
  if (viewerId) {
    member = await getActiveTeamMember(event._id, viewerId);
    if (member) {
      return {
        allowed: true,
        event,
        reason: "collaborator",
        isOwner: false,
        isAdmin,
        isCollaborator: true,
        isAttendee: false,
        member,
      };
    }
  }

  if (!approved) {
    return {
      allowed: false,
      event,
      reason: "unapproved",
      isOwner: false,
      isAdmin,
      isCollaborator: false,
      isAttendee: false,
      member: null,
    };
  }

  if (viewerId && options.allowAttendeeAccess !== false) {
    const attendee = await isAttendeeForEvent(event._id, viewerId);
    if (attendee) {
      return {
        allowed: true,
        event,
        reason: "attendee",
        isOwner: false,
        isAdmin,
        isCollaborator: false,
        isAttendee: true,
        member: null,
      };
    }
  }

  if (visibility === "private" && options.allowPrivateLink) {
    return {
      allowed: true,
      event,
      reason: "direct_link",
      isOwner: false,
      isAdmin,
      isCollaborator: false,
      isAttendee: false,
      member: null,
    };
  }

  return {
    allowed: false,
    event,
    reason: visibility === "private" ? "private" : "restricted",
    isOwner: false,
    isAdmin,
    isCollaborator: false,
    isAttendee: false,
    member: null,
  };
};

const filterViewableEvents = async (events = [], viewerOrId, options = {}) => {
  const checks = await Promise.all(
    (events || []).map(async (event) => {
      const result = await canViewEvent(event, viewerOrId, options);
      return result.allowed ? result.event : null;
    }),
  );

  return checks.filter(Boolean);
};

module.exports = {
  normalizeVisibility,
  isApprovedEvent,
  isPublicEvent,
  buildPublicEventQuery,
  canViewEvent,
  filterViewableEvents,
};
