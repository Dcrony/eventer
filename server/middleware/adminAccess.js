const ADMIN_ROLES = Object.freeze([
  "super_admin",
  "admin",
  "moderator",
  "finance_admin",
  "support_admin",
]);

const ADMIN_PERMISSIONS = Object.freeze({
  platform: "platform.view",
  analytics: "analytics.view",
  usersView: "users.view",
  usersManage: "users.manage",
  usersSuspend: "users.suspend",
  usersRoles: "users.roles",
  usersVerify: "users.verify",
  eventsView: "events.view",
  eventsModerate: "events.moderate",
  eventsFeature: "events.feature",
  ticketsView: "tickets.view",
  ticketsValidate: "tickets.validate",
  financeView: "finance.view",
  financeManage: "finance.manage",
  payoutsView: "payouts.view",
  payoutsManage: "payouts.manage",
  subscriptionsView: "subscriptions.view",
  subscriptionsManage: "subscriptions.manage",
  livestreamsView: "livestreams.view",
  livestreamsModerate: "livestreams.moderate",
  moderationView: "moderation.view",
  moderationManage: "moderation.manage",
  notificationsView: "notifications.view",
  notificationsManage: "notifications.manage",
  settingsView: "settings.view",
  settingsManage: "settings.manage",
  auditView: "audit.view",
  adminsManage: "admins.manage",
});

const ROLE_PERMISSIONS = Object.freeze({
  super_admin: Object.values(ADMIN_PERMISSIONS),
  admin: [
    ADMIN_PERMISSIONS.platform,
    ADMIN_PERMISSIONS.analytics,
    ADMIN_PERMISSIONS.usersView,
    ADMIN_PERMISSIONS.usersManage,
    ADMIN_PERMISSIONS.usersSuspend,
    ADMIN_PERMISSIONS.usersRoles,
    ADMIN_PERMISSIONS.usersVerify,
    ADMIN_PERMISSIONS.eventsView,
    ADMIN_PERMISSIONS.eventsModerate,
    ADMIN_PERMISSIONS.eventsFeature,
    ADMIN_PERMISSIONS.ticketsView,
    ADMIN_PERMISSIONS.ticketsValidate,
    ADMIN_PERMISSIONS.financeView,
    ADMIN_PERMISSIONS.financeManage,
    ADMIN_PERMISSIONS.payoutsView,
    ADMIN_PERMISSIONS.payoutsManage,
    ADMIN_PERMISSIONS.subscriptionsView,
    ADMIN_PERMISSIONS.subscriptionsManage,
    ADMIN_PERMISSIONS.livestreamsView,
    ADMIN_PERMISSIONS.livestreamsModerate,
    ADMIN_PERMISSIONS.moderationView,
    ADMIN_PERMISSIONS.moderationManage,
    ADMIN_PERMISSIONS.notificationsView,
    ADMIN_PERMISSIONS.notificationsManage,
    ADMIN_PERMISSIONS.settingsView,
    ADMIN_PERMISSIONS.auditView,
  ],
  moderator: [
    ADMIN_PERMISSIONS.platform,
    ADMIN_PERMISSIONS.analytics,
    ADMIN_PERMISSIONS.usersView,
    ADMIN_PERMISSIONS.usersSuspend,
    ADMIN_PERMISSIONS.usersVerify,
    ADMIN_PERMISSIONS.eventsView,
    ADMIN_PERMISSIONS.eventsModerate,
    ADMIN_PERMISSIONS.eventsFeature,
    ADMIN_PERMISSIONS.ticketsView,
    ADMIN_PERMISSIONS.ticketsValidate,
    ADMIN_PERMISSIONS.livestreamsView,
    ADMIN_PERMISSIONS.livestreamsModerate,
    ADMIN_PERMISSIONS.moderationView,
    ADMIN_PERMISSIONS.moderationManage,
    ADMIN_PERMISSIONS.notificationsView,
    ADMIN_PERMISSIONS.auditView,
  ],
  finance_admin: [
    ADMIN_PERMISSIONS.platform,
    ADMIN_PERMISSIONS.analytics,
    ADMIN_PERMISSIONS.financeView,
    ADMIN_PERMISSIONS.financeManage,
    ADMIN_PERMISSIONS.payoutsView,
    ADMIN_PERMISSIONS.payoutsManage,
    ADMIN_PERMISSIONS.subscriptionsView,
    ADMIN_PERMISSIONS.subscriptionsManage,
    ADMIN_PERMISSIONS.ticketsView,
    ADMIN_PERMISSIONS.auditView,
  ],
  support_admin: [
    ADMIN_PERMISSIONS.platform,
    ADMIN_PERMISSIONS.analytics,
    ADMIN_PERMISSIONS.usersView,
    ADMIN_PERMISSIONS.usersSuspend,
    ADMIN_PERMISSIONS.eventsView,
    ADMIN_PERMISSIONS.ticketsView,
    ADMIN_PERMISSIONS.notificationsView,
    ADMIN_PERMISSIONS.notificationsManage,
    ADMIN_PERMISSIONS.moderationView,
    ADMIN_PERMISSIONS.auditView,
  ],
});

const isAdminRole = (role) => ADMIN_ROLES.includes(String(role || "").trim());

const getAdminPermissionsForRole = (role) => {
  const normalizedRole = String(role || "").trim();
  return [...(ROLE_PERMISSIONS[normalizedRole] || [])];
};

const getAdminAccessProfile = (user) => {
  const role = String(user?.role || "").trim();
  return {
    isAdmin: isAdminRole(role),
    role,
    permissions: getAdminPermissionsForRole(role),
  };
};

const authorizeAdmin = (req, res, next) => {
  const access = getAdminAccessProfile(req.user);
  if (!access.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  req.adminAccess = access;
  return next();
};

const requireAdminPermission = (...permissions) => (req, res, next) => {
  const access = req.adminAccess || getAdminAccessProfile(req.user);
  if (!access.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  if (!permissions.some((permission) => access.permissions.includes(permission))) {
    return res.status(403).json({
      message: "You do not have permission to perform this action",
      requiredPermissions: permissions,
    });
  }

  req.adminAccess = access;
  return next();
};

module.exports = {
  ADMIN_ROLES,
  ADMIN_PERMISSIONS,
  ROLE_PERMISSIONS,
  isAdminRole,
  getAdminPermissionsForRole,
  getAdminAccessProfile,
  authorizeAdmin,
  requireAdminPermission,
};
