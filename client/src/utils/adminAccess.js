export const ADMIN_ROLES = ["super_admin", "admin", "moderator", "finance_admin", "support_admin"];

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(String(role || "").trim());
}

export function hasAdminAccess(user) {
  return isAdminRole(user?.role) || user?.isAdmin === true;
}
