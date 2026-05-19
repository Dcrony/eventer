const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { authorizeAdmin, requireAdminPermission, ADMIN_PERMISSIONS } = require("../middleware/adminAccess");
const {
  getAdminPermissions,
  getGlobalSearch,
  getPlatformStats,
  getRevenueAnalytics,
  getPlatformMetrics,
  getAllUsers,
  getUserDetails,
  toggleUserStatus,
  toggleUserVerification,
  updateUserRole,
  updateUserSubscription,
  deleteUser,
  getAllEvents,
  updateEventStatus,
  toggleEventFeatured,
  getLivestreamOverview,
  forceStopLivestream,
  getTransactions,
  exportTransactions,
  getFinanceOverview,
  getSubscriptionOverview,
  getModerationOverview,
  getActivityLogs,
  sendAnnouncement,
  getAnnouncements,
  getAdminSettings,
  updateAdminSettings,
} = require("../controllers/adminController");
const {
  adminUpdateWithdrawal,
  getAdminWithdrawals,
  getWithdrawalAnalytics,
  getMonthlyWithdrawalTrend,
  exportAdminWithdrawals,
} = require("../controllers/withdrawalController");

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeAdmin);

router.get("/permissions", getAdminPermissions);
router.get("/search", requireAdminPermission(ADMIN_PERMISSIONS.platform), getGlobalSearch);

router.get("/stats", requireAdminPermission(ADMIN_PERMISSIONS.platform, ADMIN_PERMISSIONS.analytics), getPlatformStats);
router.get("/revenue", requireAdminPermission(ADMIN_PERMISSIONS.financeView, ADMIN_PERMISSIONS.analytics), getRevenueAnalytics);
router.get("/metrics", requireAdminPermission(ADMIN_PERMISSIONS.platform, ADMIN_PERMISSIONS.analytics), getPlatformMetrics);
router.get("/finance", requireAdminPermission(ADMIN_PERMISSIONS.financeView), getFinanceOverview);
router.get("/subscriptions", requireAdminPermission(ADMIN_PERMISSIONS.subscriptionsView), getSubscriptionOverview);
router.get("/moderation", requireAdminPermission(ADMIN_PERMISSIONS.moderationView), getModerationOverview);
router.get("/livestreams", requireAdminPermission(ADMIN_PERMISSIONS.livestreamsView), getLivestreamOverview);

router.get("/users", requireAdminPermission(ADMIN_PERMISSIONS.usersView), getAllUsers);
router.get("/users/:userId", requireAdminPermission(ADMIN_PERMISSIONS.usersView), getUserDetails);
router.patch("/users/:userId/status", requireAdminPermission(ADMIN_PERMISSIONS.usersSuspend), toggleUserStatus);
router.patch("/users/:userId/verify", requireAdminPermission(ADMIN_PERMISSIONS.usersVerify), toggleUserVerification);
router.patch("/users/:userId/role", requireAdminPermission(ADMIN_PERMISSIONS.usersRoles, ADMIN_PERMISSIONS.adminsManage), updateUserRole);
router.patch("/users/:userId/subscription", requireAdminPermission(ADMIN_PERMISSIONS.subscriptionsManage), updateUserSubscription);
router.delete("/users/:userId", requireAdminPermission(ADMIN_PERMISSIONS.usersManage), deleteUser);

router.get("/events", requireAdminPermission(ADMIN_PERMISSIONS.eventsView), getAllEvents);
router.patch("/events/:eventId/status", requireAdminPermission(ADMIN_PERMISSIONS.eventsModerate), updateEventStatus);
router.patch("/events/:eventId/featured", requireAdminPermission(ADMIN_PERMISSIONS.eventsFeature), toggleEventFeatured);
router.patch("/events/:eventId/livestream/stop", requireAdminPermission(ADMIN_PERMISSIONS.livestreamsModerate), forceStopLivestream);

router.get("/transactions", requireAdminPermission(ADMIN_PERMISSIONS.financeView, ADMIN_PERMISSIONS.ticketsView), getTransactions);
router.get("/transactions/export", requireAdminPermission(ADMIN_PERMISSIONS.financeView), exportTransactions);

router.get("/withdrawals", requireAdminPermission(ADMIN_PERMISSIONS.payoutsView), getAdminWithdrawals);
router.get("/withdrawals/analytics", requireAdminPermission(ADMIN_PERMISSIONS.payoutsView), getWithdrawalAnalytics);
router.get("/withdrawals/monthly", requireAdminPermission(ADMIN_PERMISSIONS.payoutsView), getMonthlyWithdrawalTrend);
router.get("/withdrawals/export", requireAdminPermission(ADMIN_PERMISSIONS.payoutsView), exportAdminWithdrawals);
router.patch("/withdrawals/:id", requireAdminPermission(ADMIN_PERMISSIONS.payoutsManage), adminUpdateWithdrawal);

router.get("/logs", requireAdminPermission(ADMIN_PERMISSIONS.auditView), getActivityLogs);
router.get("/announcements", requireAdminPermission(ADMIN_PERMISSIONS.notificationsView), getAnnouncements);
router.post("/announcement", requireAdminPermission(ADMIN_PERMISSIONS.notificationsManage), sendAnnouncement);

router.get("/settings", requireAdminPermission(ADMIN_PERMISSIONS.settingsView), getAdminSettings);
router.put("/settings", requireAdminPermission(ADMIN_PERMISSIONS.settingsManage, ADMIN_PERMISSIONS.adminsManage), updateAdminSettings);

module.exports = router;
