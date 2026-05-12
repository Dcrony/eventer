const Event = require("../models/Event");
const EventTeam = require("../models/EventTeam");
const User = require("../models/User");
const { hasAccess, getFeatureLabel } = require("../services/featureService");

const OWNER_USER_SELECT = "name username email profilePic role isVerified billing plan trialEndsAt subscriptionStatus";

const PERMISSION_KEYS = Object.freeze([
  "canEditEvent",
  "canDeleteEvent",
  "canManageTickets",
  "canViewAnalytics",
  "canManageLivestream",
  "canViewTickets",
  "canManageTeam",
]);

const ROLE_PERMISSIONS = Object.freeze({
  co_organizer: {
    canEditEvent: true,
    canDeleteEvent: false,
    canManageTickets: true,
    canViewAnalytics: true,
    canManageLivestream: true,
    canViewTickets: true,
    canManageTeam: true,
  },
  ticket_manager: {
    canEditEvent: false,
    canDeleteEvent: false,
    canManageTickets: true,
    canViewAnalytics: false,
    canManageLivestream: false,
    canViewTickets: true,
    canManageTeam: false,
  },
  analytics_viewer: {
    canEditEvent: false,
    canDeleteEvent: false,
    canManageTickets: false,
    canViewAnalytics: true,
    canManageLivestream: false,
    canViewTickets: false,
    canManageTeam: false,
  },
  livestream_moderator: {
    canEditEvent: false,
    canDeleteEvent: false,
    canManageTickets: false,
    canViewAnalytics: false,
    canManageLivestream: true,
    canViewTickets: false,
    canManageTeam: false,
  },
});

const FULL_PERMISSIONS = Object.freeze(
  PERMISSION_KEYS.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {}),
);

const EMPTY_PERMISSIONS = Object.freeze(
  PERMISSION_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {}),
);

const FEATURE_KEY_MAP = Object.freeze({
  analytics: "ANALYTICS_ADVANCED",
  liveStream: "LIVE_STREAM",
  teamMembers: "TEAM_MEMBERS",
  refunds: "REFUNDS",
});

const clonePermissions = (permissions) => ({
  ...EMPTY_PERMISSIONS,
  ...(permissions || {}),
});

const getRolePermissions = (role) => clonePermissions(ROLE_PERMISSIONS[role] || EMPTY_PERMISSIONS);

const toSerializableAccess = (access) => {
  if (!access) {
    return {
      hasAccess: false,
      isOwner: false,
      isAdmin: false,
      isCollaborator: false,
      role: null,
      permissions: clonePermissions(),
      featureAccess: {
        analytics: false,
        liveStream: false,
        teamMembers: false,
        refunds: false,
      },
    };
  }

  return {
    hasAccess: Boolean(access.hasAccess),
    isOwner: Boolean(access.isOwner),
    isAdmin: Boolean(access.isAdmin),
    isCollaborator: Boolean(access.isCollaborator),
    role: access.role || null,
    permissions: clonePermissions(access.permissions),
    featureAccess: {
      analytics: Boolean(access.featureAccess?.analytics),
      liveStream: Boolean(access.featureAccess?.liveStream),
      teamMembers: Boolean(access.featureAccess?.teamMembers),
      refunds: Boolean(access.featureAccess?.refunds),
    },
  };
};

const findActiveMember = (eventTeam, userId) => {
  if (!eventTeam || !userId) return null;

  return (
    eventTeam.members.find(
      (member) =>
        member?.isActive &&
        String(member.user?._id || member.user) === String(userId),
    ) || null
  );
};

const ensureOwnerUser = async (event) => {
  if (!event?.createdBy) return null;

  if (event.createdBy?.plan || event.createdBy?.username || event.createdBy?.email) {
    return event.createdBy;
  }

  return User.findById(event.createdBy).select(OWNER_USER_SELECT);
};

const getFeatureAccessForOwner = async (event, isAdmin = false) => {
  if (isAdmin) {
    return {
      analytics: true,
      liveStream: true,
      teamMembers: true,
      refunds: true,
    };
  }

  const ownerUser = await ensureOwnerUser(event);

  return {
    analytics: Boolean(ownerUser && hasAccess(ownerUser, FEATURE_KEY_MAP.analytics)),
    liveStream: Boolean(ownerUser && hasAccess(ownerUser, FEATURE_KEY_MAP.liveStream)),
    teamMembers: Boolean(ownerUser && hasAccess(ownerUser, FEATURE_KEY_MAP.teamMembers)),
    refunds: Boolean(ownerUser && hasAccess(ownerUser, FEATURE_KEY_MAP.refunds)),
  };
};

const getEventAccessForUser = async (eventOrId, userOrId, options = {}) => {
  let event = eventOrId;
  if (!event?._id) {
    event = await Event.findById(eventOrId).populate("createdBy", OWNER_USER_SELECT);
  }

  if (!event) {
    return {
      event: null,
      eventTeam: null,
      hasAccess: false,
      isOwner: false,
      isAdmin: false,
      isCollaborator: false,
      role: null,
      permissions: clonePermissions(),
      featureAccess: {
        analytics: false,
        liveStream: false,
        teamMembers: false,
        refunds: false,
      },
      member: null,
    };
  }

  const userId = String(userOrId?.id || userOrId?._id || userOrId || "");
  const userRole = userOrId?.role || options.userRole || null;
  const isAdmin = userRole === "admin";
  const ownerId = String(event.createdBy?._id || event.createdBy || "");
  const isOwner = Boolean(userId) && ownerId === userId;

  let eventTeam = options.eventTeam || null;
  let member = null;
  let role = null;
  let permissions = clonePermissions();

  if (isAdmin || isOwner) {
    role = isAdmin ? "admin" : "owner";
    permissions = clonePermissions(FULL_PERMISSIONS);
  } else if (userId) {
    if (!eventTeam) {
      eventTeam = await EventTeam.findOne({ event: event._id });
    }
    member = findActiveMember(eventTeam, userId);
    if (member) {
      role = member.role;
      permissions = clonePermissions(member.permissions || getRolePermissions(member.role));
    }
  }

  return {
    event,
    eventTeam,
    member,
    hasAccess: Boolean(isAdmin || isOwner || member),
    isOwner,
    isAdmin,
    isCollaborator: Boolean(member),
    role,
    permissions,
    featureAccess: await getFeatureAccessForOwner(event, isAdmin),
  };
};

const hasPermission = (access, key) => Boolean(access?.isAdmin || access?.isOwner || access?.permissions?.[key]);

const canEditEvent = (access) => hasPermission(access, "canEditEvent");
const canManageTickets = (access) =>
  hasPermission(access, "canManageTickets") || hasPermission(access, "canViewTickets");
const canAccessAnalytics = (access) =>
  hasPermission(access, "canViewAnalytics") && Boolean(access?.featureAccess?.analytics);
const canModerateLivestream = (access) =>
  hasPermission(access, "canManageLivestream") && Boolean(access?.featureAccess?.liveStream);
const canManageTeam = (access) =>
  hasPermission(access, "canManageTeam") && Boolean(access?.featureAccess?.teamMembers);
const canDeleteEvent = (access) => hasPermission(access, "canDeleteEvent");

const FEATURE_LABEL_MAP = Object.freeze({
  analytics: getFeatureLabel(FEATURE_KEY_MAP.analytics),
  liveStream: getFeatureLabel(FEATURE_KEY_MAP.liveStream),
  teamMembers: getFeatureLabel(FEATURE_KEY_MAP.teamMembers),
  refunds: getFeatureLabel(FEATURE_KEY_MAP.refunds),
});

const authorizeEventAction = async ({
  eventId,
  event,
  user,
  permission,
  deniedMessage = "You do not have permission to access this event",
}) => {
  const access = await getEventAccessForUser(event || eventId, user);

  if (!access.event) {
    return {
      error: { status: 404, message: "Event not found" },
      access,
    };
  }

  const permissionChecks = {
    canEditEvent,
    canManageTickets,
    canAccessAnalytics,
    canModerateLivestream,
    canManageTeam,
    canDeleteEvent,
  };

  const permissionCheck = permission ? permissionChecks[permission] : null;
  const featureFailures = {
    canAccessAnalytics: !access.featureAccess?.analytics,
    canModerateLivestream: !access.featureAccess?.liveStream,
    canManageTeam: !access.featureAccess?.teamMembers,
  };

  if (!access.hasAccess || (permissionCheck && !permissionCheck(access))) {
    if (permission && featureFailures[permission]) {
      const featureKey = {
        canAccessAnalytics: "analytics",
        canModerateLivestream: "liveStream",
        canManageTeam: "teamMembers",
      }[permission];

      return {
        error: {
          status: 403,
          code: "PLAN_UPGRADE_REQUIRED",
          message: `Upgrade to Pro to access ${FEATURE_LABEL_MAP[featureKey]}.`,
        },
        access,
      };
    }

    return {
      error: { status: 403, message: deniedMessage },
      access,
    };
  }

  return { event: access.event, access };
};

module.exports = {
  PERMISSION_KEYS,
  FULL_PERMISSIONS,
  EMPTY_PERMISSIONS,
  ROLE_PERMISSIONS,
  getRolePermissions,
  toSerializableAccess,
  findActiveMember,
  getEventAccessForUser,
  authorizeEventAction,
  canEditEvent,
  canManageTickets,
  canAccessAnalytics,
  canModerateLivestream,
  canManageTeam,
  canDeleteEvent,
};
