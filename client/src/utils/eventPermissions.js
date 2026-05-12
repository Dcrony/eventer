export const ROLE_LABELS = {
  co_organizer: "Co-organizer",
  ticket_manager: "Ticket manager",
  analytics_viewer: "Analytics viewer",
  livestream_moderator: "Livestream moderator",
};

const EMPTY_FEATURE_ACCESS = {
  analytics: false,
  liveStream: false,
  teamMembers: false,
  refunds: false,
};

const EMPTY_PERMISSIONS = {
  canEditEvent: false,
  canDeleteEvent: false,
  canManageTickets: false,
  canViewAnalytics: false,
  canManageLivestream: false,
  canViewTickets: false,
  canManageTeam: false,
};

export const getEventAccess = (event) => ({
  hasAccess: Boolean(event?.eventAccess?.hasAccess),
  isOwner: Boolean(event?.eventAccess?.isOwner),
  isAdmin: Boolean(event?.eventAccess?.isAdmin),
  isCollaborator: Boolean(event?.eventAccess?.isCollaborator),
  role: event?.eventAccess?.role || null,
  permissions: {
    ...EMPTY_PERMISSIONS,
    ...(event?.eventAccess?.permissions || {}),
  },
  featureAccess: {
    ...EMPTY_FEATURE_ACCESS,
    ...(event?.eventAccess?.featureAccess || {}),
  },
});

export const canEditEvent = (event) => getEventAccess(event).permissions.canEditEvent;
export const canManageTickets = (event) => {
  const access = getEventAccess(event);
  return access.permissions.canManageTickets || access.permissions.canViewTickets;
};
export const canAccessAnalytics = (event) => {
  const access = getEventAccess(event);
  return access.permissions.canViewAnalytics && access.featureAccess.analytics;
};
export const canModerateLivestream = (event) => {
  const access = getEventAccess(event);
  return access.permissions.canManageLivestream && access.featureAccess.liveStream;
};
export const canManageTeam = (event) => {
  const access = getEventAccess(event);
  return access.permissions.canManageTeam && access.featureAccess.teamMembers;
};

export const getFeaturedRoleLabel = (event) =>
  event?.featuredRole ? ROLE_LABELS[event.featuredRole] || event.featuredRole : "";
