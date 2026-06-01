const mongoose = require("mongoose");
const User = require("../models/User");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const Announcement = require("../models/Announcement");
const ActivityLog = require("../models/ActivityLog");
const BillingHistory = require("../models/BillingHistory");
const PlatformSetting = require("../models/PlatformSetting");
const { createNotification } = require("../services/notificationService");
const { ADMIN_ROLES, ROLE_PERMISSIONS } = require("../middleware/adminAccess");
const { getPlatformTicketFeePercent } = require("../utils/platformFee");
const { normalizePlan, syncUserBillingState } = require("../services/billingService");
const { assignTrialToUser } = require("../services/subscriptionService");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const USER_SAFE_SELECT = "-password -verificationCode -verificationCodeExpires -resetPasswordToken -resetPasswordExpires -emailVerificationToken";
const USER_ROLES = ["super_admin", "admin", "moderator", "finance_admin", "support_admin", "organizer", "user"];
const MODERATABLE_EVENT_STATUSES = ["approved", "rejected", "pending", "suspended"];
const PLATFORM_SETTINGS_KEY = "platform";

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePagination = (page, limit, fallbackLimit = DEFAULT_LIMIT) => {
  const safePage = Math.max(Number.parseInt(page, 10) || DEFAULT_PAGE, 1);
  const safeLimit = Math.max(Number.parseInt(limit, 10) || fallbackLimit, 1);
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.max(Math.ceil(total / limit), 1),
});

const buildDateRangeFilter = (startDate, endDate, key) => {
  if (!startDate && !endDate) return null;
  const range = {};

  if (startDate) {
    const start = new Date(startDate);
    if (!Number.isNaN(start.getTime())) {
      range.$gte = start;
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
  }

  if (!Object.keys(range).length) return null;
  return { [key]: range };
};

const toObjectId = (value) => {
  try {
    return new mongoose.Types.ObjectId(String(value));
  } catch {
    return null;
  }
};

const formatCsvValue = (value) => {
  const safe = String(value ?? "");
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const buildCsv = (headers, rows) => [headers, ...rows].map((row) => row.map(formatCsvValue).join(",")).join("\n");

const normalizeTicketStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "success") return "paid";
  if (normalized === "failed" || normalized === "pending") return "__unsupported__";
  return normalized;
};

const ticketStatusLabel = (ticket) => (ticket?.paymentStatus === "paid" ? "success" : "free");

const validateEventStatus = (status) => MODERATABLE_EVENT_STATUSES.includes(status);

const getRangeStart = (days = 30) => {
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - Math.max(Number(days) || 30, 1));
  return rangeStart;
};

const summarizeRiskIndicators = (user, extras = {}) => {
  const indicators = [];

  if (user?.isSuspended) indicators.push({ tone: "rose", label: "Suspended account" });
  if (user?.isDeleted) indicators.push({ tone: "rose", label: "Deactivated account" });
  if (user?.role === "organizer" && !user?.isVerified) indicators.push({ tone: "amber", label: "Organizer not verified" });
  if ((extras.failedPayments || 0) > 2) indicators.push({ tone: "amber", label: "Multiple failed payments" });
  if ((extras.refundedTickets || 0) > 3) indicators.push({ tone: "amber", label: "High refund activity" });
  if ((extras.pendingWithdrawals || 0) > 0) indicators.push({ tone: "blue", label: "Pending payout activity" });

  return indicators;
};

async function getOrCreatePlatformSettings() {
  return PlatformSetting.findOneAndUpdate(
    { key: PLATFORM_SETTINGS_KEY },
    { $setOnInsert: { key: PLATFORM_SETTINGS_KEY } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

async function logAdminActivity(req, action, targetType, targetId = null, details = null, meta = {}) {
  try {
    await ActivityLog.create({
      adminId: req.user._id,
      action,
      targetType,
      targetId,
      details,
      ipAddress: req.ip || null,
      meta: {
        actorRole: req.user.role,
        ...meta,
      },
    });
  } catch (error) {
    console.error("Failed to log admin activity:", error);
  }
}

exports.getAdminPermissions = async (req, res) => {
  return res.json({
    success: true,
    currentRole: req.adminAccess?.role || req.user.role,
    permissions: req.adminAccess?.permissions || [],
    roles: USER_ROLES,
    rolePermissions: ROLE_PERMISSIONS,
  });
};

exports.getGlobalSearch = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.json({
        success: true,
        query: "",
        results: { users: [], events: [], transactions: [], withdrawals: [], subscriptions: [], livestreams: [] },
      });
    }

    const regex = new RegExp(escapeRegex(q), "i");

    const [users, events, transactions, withdrawals, subscriptions, livestreams] = await Promise.all([
      User.find({
        isDeleted: { $ne: true },
        $or: [{ name: regex }, { username: regex }, { email: regex }],
      })
        .select("name username email role plan isVerified isSuspended")
        .sort({ updatedAt: -1 })
        .limit(6)
        .lean(),
      Event.find({
        $or: [{ title: regex }, { category: regex }, { location: regex }],
      })
        .select("title category status visibility isFeatured createdAt startDate")
        .populate("createdBy", "name username email")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Ticket.find({
        $or: [{ reference: regex }, { ticketType: regex }],
      })
        .select("reference ticketType amount quantity paymentStatus purchasedAt")
        .populate("buyer", "name username email")
        .populate("event", "title")
        .sort({ purchasedAt: -1 })
        .limit(6)
        .lean(),
      Withdrawal.find({})
        .populate({
          path: "organizer",
          match: { $or: [{ name: regex }, { username: regex }, { email: regex }] },
          select: "name username email",
        })
        .select("amount status createdAt fee")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      BillingHistory.find({
        $or: [{ reference: regex }, { plan: regex }],
      })
        .populate("userId", "name username email")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Event.find({
        "liveStream.isLive": true,
        $or: [{ title: regex }, { category: regex }, { location: regex }],
      })
        .select("title category liveStream startDate")
        .populate("createdBy", "name username email")
        .limit(6)
        .lean(),
    ]);

    return res.json({
      success: true,
      query: q,
      results: {
        users,
        events,
        transactions,
        withdrawals: withdrawals.filter((item) => item.organizer),
        subscriptions,
        livestreams,
      },
    });
  } catch (error) {
    console.error("Error performing admin search:", error);
    return res.status(500).json({ message: "Failed to run admin search" });
  }
};

exports.getPlatformStats = async (req, res) => {
  try {
    const settings = await getOrCreatePlatformSettings();
    const now = new Date();
    const rangeStart = getRangeStart(req.query.days || 30);
    const commissionPercent = Number(settings.commissionPercent || getPlatformTicketFeePercent() || 0);

    const [
      totalUsers,
      activeUsers,
      newUsers,
      suspendedUsers,
      verifiedOrganizers,
      adminUsers,
      totalEvents,
      pendingEvents,
      approvedEvents,
      rejectedEvents,
      suspendedEvents,
      featuredEvents,
      liveEvents,
      privateEvents,
      totalTicketsAgg,
      refundedTicketsAgg,
      checkedInTicketsAgg,
      paidRevenueAgg,
      rangeRevenueAgg,
      subscriptionRevenueAgg,
      pendingPayoutAgg,
      completedPayoutAgg,
      payoutEscrowPendingAgg,
      recentTransactions,
      recentWithdrawals,
      recentActivities,
      topEvents,
      topOrganizers,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ updatedAt: { $gte: rangeStart }, isDeleted: { $ne: true } }),
      User.countDocuments({ createdAt: { $gte: rangeStart }, isDeleted: { $ne: true } }),
      User.countDocuments({ isSuspended: true, isDeleted: { $ne: true } }),
      User.countDocuments({ role: "organizer", isVerified: true, isDeleted: { $ne: true } }),
      User.countDocuments({ role: { $in: ADMIN_ROLES }, isDeleted: { $ne: true } }),
      Event.countDocuments(),
      Event.countDocuments({ status: "pending" }),
      Event.countDocuments({ status: "approved" }),
      Event.countDocuments({ status: "rejected" }),
      Event.countDocuments({ status: "suspended" }),
      Event.countDocuments({ isFeatured: true }),
      Event.countDocuments({ "liveStream.isLive": true }),
      Event.countDocuments({ visibility: "private" }),
      Ticket.aggregate([{ $group: { _id: null, total: { $sum: "$quantity" } } }]),
      Ticket.aggregate([{ $match: { status: "refunded" } }, { $group: { _id: null, total: { $sum: "$quantity" } } }]),
      Ticket.aggregate([{ $match: { status: "checked-in" } }, { $group: { _id: null, total: { $sum: "$quantity" } } }]),
      Ticket.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Ticket.aggregate([
        { $match: { paymentStatus: "paid", purchasedAt: { $gte: rangeStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      BillingHistory.aggregate([{ $match: { status: "success" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Withdrawal.aggregate([
        { $match: { status: { $in: ["pending", "approved", "processing"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Withdrawal.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      // include pending payouts from escrow
      (await (require("../models/Payout")).aggregate([
        { $match: { state: { $in: ["pending", "under_review", "scheduled"] } } },
        { $group: { _id: null, total: { $sum: "$netAmount" } } },
      ])),
      Ticket.find({})
        .populate("buyer", "name username email")
        .populate("event", "title")
        .sort({ purchasedAt: -1 })
        .limit(6)
        .lean(),
      Withdrawal.find({})
        .populate("organizer", "name username email")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      ActivityLog.find({})
        .populate("adminId", "name username email role")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Ticket.aggregate([
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: "$event",
            revenue: { $sum: "$amount" },
            ticketsSold: { $sum: "$quantity" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "events",
            localField: "_id",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: "$event" },
      ]),
      Ticket.aggregate([
        { $match: { paymentStatus: "paid" } },
        {
          $lookup: {
            from: "events",
            localField: "event",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: "$event" },
        {
          $group: {
            _id: "$event.createdBy",
            revenue: { $sum: "$amount" },
            ticketsSold: { $sum: "$quantity" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "organizer",
          },
        },
        { $unwind: "$organizer" },
      ]),
    ]);

    const grossRevenue = paidRevenueAgg[0]?.total || 0;
    const subscriptionRevenue = subscriptionRevenueAgg[0]?.total || 0;
    const commissionRevenue = Math.round((grossRevenue * commissionPercent) / 100);
    const organizerRevenue = Math.max(grossRevenue - commissionRevenue, 0);

    return res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          new: newUsers,
          suspended: suspendedUsers,
          verifiedOrganizers,
          admins: adminUsers,
        },
        events: {
          total: totalEvents,
          pending: pendingEvents,
          approved: approvedEvents,
          rejected: rejectedEvents,
          suspended: suspendedEvents,
          featured: featuredEvents,
          live: liveEvents,
          private: privateEvents,
        },
        tickets: {
          total: totalTicketsAgg[0]?.total || 0,
          refunded: refundedTicketsAgg[0]?.total || 0,
          checkedIn: checkedInTicketsAgg[0]?.total || 0,
        },
        revenue: {
          total: grossRevenue,
          thisPeriod: rangeRevenueAgg[0]?.total || 0,
          organizerRevenue,
          subscriptionRevenue,
          commissionRevenue,
          pendingPayouts: (pendingPayoutAgg[0]?.total || 0) + (payoutEscrowPendingAgg[0]?.total || 0),
          completedPayouts: completedPayoutAgg[0]?.total || 0,
        },
        platform: {
          maintenanceMode: Boolean(settings.maintenanceMode),
          livestreamEnabled: Boolean(settings.livestreamEnabled),
          tickiAiEnabled: Boolean(settings.tickiAiEnabled),
          eventApprovalRequired: Boolean(settings.eventApprovalRequired),
          systemHealth: {
            api: "healthy",
            mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
            clock: now.toISOString(),
          },
        },
        topEvents,
        topOrganizers,
        recentTransactions,
        recentWithdrawals,
        recentActivities,
      },
    });
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    return res.status(500).json({ message: "Failed to fetch platform stats" });
  }
};

exports.getRevenueAnalytics = async (req, res) => {
  try {
    const start = req.query.startDate ? new Date(req.query.startDate) : getRangeStart(90);
    const end = req.query.endDate ? new Date(req.query.endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const [ticketRevenue, subscriptionRevenue, withdrawalFees, totals] = await Promise.all([
      Ticket.aggregate([
        { $match: { paymentStatus: "paid", purchasedAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$purchasedAt" } },
            revenue: { $sum: "$amount" },
            ticketsSold: { $sum: "$quantity" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      BillingHistory.aggregate([
        { $match: { status: "success", createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Withdrawal.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$fee" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Promise.all([
        Ticket.aggregate([{ $match: { paymentStatus: "paid", purchasedAt: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: "$quantity" } } }]),
        BillingHistory.aggregate([{ $match: { status: "success", createdAt: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
        Withdrawal.aggregate([{ $match: { createdAt: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: "$fee" } } }]),
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        daily: ticketRevenue,
        subscriptions: subscriptionRevenue,
        withdrawalFees,
        summary: {
          ticketRevenue: totals[0][0]?.total || 0,
          ticketsSold: totals[0][0]?.count || 0,
          subscriptionRevenue: totals[1][0]?.total || 0,
          subscriptionsCount: totals[1][0]?.count || 0,
          withdrawalFeeRevenue: totals[2][0]?.total || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    return res.status(500).json({ message: "Failed to fetch revenue analytics" });
  }
};

exports.getPlatformMetrics = async (req, res) => {
  try {
    const rangeStart = getRangeStart(req.query.days || 30);
    const [userGrowth, eventTrends, transactionTrends, withdrawalTrends, subscriptionTrends] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: rangeStart }, isDeleted: { $ne: true } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Event.aggregate([
        { $match: { createdAt: { $gte: rangeStart } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Ticket.aggregate([
        { $match: { purchasedAt: { $gte: rangeStart }, paymentStatus: "paid" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$purchasedAt" } },
            revenue: { $sum: "$amount" },
            count: { $sum: "$quantity" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Withdrawal.aggregate([
        { $match: { createdAt: { $gte: rangeStart } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      BillingHistory.aggregate([
        { $match: { status: "success", createdAt: { $gte: rangeStart } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return res.json({
      success: true,
      metrics: {
        userGrowth,
        eventTrends,
        transactionTrends,
        withdrawalTrends,
        subscriptionTrends,
      },
    });
  } catch (error) {
    console.error("Error fetching platform metrics:", error);
    return res.status(500).json({ message: "Failed to fetch platform metrics" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, status, verified, plan, sort = "newest" } = req.query;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
    const filter = { isDeleted: { $ne: true } };

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: regex }, { email: regex }, { username: regex }];
    }

    if (role) filter.role = role;
    if (plan) filter.plan = normalizePlan(plan);

    if (status === "suspended") filter.isSuspended = true;
    else if (status === "active") filter.isSuspended = false;

    if (verified === "true") filter.isVerified = true;
    if (verified === "false") filter.isVerified = false;

    const sortOption = sort === "oldest" ? { createdAt: 1 } : sort === "name" ? { name: 1 } : { createdAt: -1 };

    const [users, total, summaryAgg] = await Promise.all([
      User.find(filter).select(USER_SAFE_SELECT).sort(sortOption).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
      User.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            admins: { $sum: { $cond: [{ $in: ["$role", ADMIN_ROLES] }, 1, 0] } },
            organizers: { $sum: { $cond: [{ $eq: ["$role", "organizer"] }, 1, 0] } },
            verifiedOrganizers: {
              $sum: { $cond: [{ $and: [{ $eq: ["$role", "organizer"] }, { $eq: ["$isVerified", true] }] }, 1, 0] },
            },
            suspended: { $sum: { $cond: [{ $eq: ["$isSuspended", true] }, 1, 0] } },
            proUsers: { $sum: { $cond: [{ $eq: ["$plan", "pro"] }, 1, 0] } },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      users,
      summary: summaryAgg[0] || {
        total: 0,
        admins: 0,
        organizers: 0,
        verifiedOrganizers: 0,
        suspended: 0,
        proUsers: 0,
      },
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select(USER_SAFE_SELECT).populate({
      path: "favorites",
      select: "title image startDate category",
    });

    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    const [events, transactions, billingHistory, withdrawals, failedPaymentCount, refundedTicketsCount] = await Promise.all([
      Event.find({ createdBy: userId }).select("title category status visibility isFeatured ticketsSold totalTickets startDate createdAt liveStream").lean(),
      Ticket.find({ buyer: userId }).populate("event", "title category").sort({ purchasedAt: -1 }).limit(20).lean(),
      BillingHistory.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
      Withdrawal.find({ organizer: userId }).sort({ createdAt: -1 }).limit(20).lean(),
      BillingHistory.countDocuments({ userId, status: "failed" }),
      Ticket.countDocuments({ buyer: userId, status: "refunded" }),
    ]);

    return res.json({
      success: true,
      user,
      events,
      transactions,
      billingHistory,
      withdrawals,
      riskIndicators: summarizeRiskIndicators(user, {
        failedPayments: failedPaymentCount,
        refundedTickets: refundedTicketsCount,
        pendingWithdrawals: withdrawals.filter((item) => ["pending", "approved", "processing"].includes(item.status)).length,
      }),
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(500).json({ message: "Failed to fetch user details" });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { suspend } = req.body;

    if (typeof suspend !== "boolean") {
      return res.status(400).json({ message: "A boolean suspend value is required" });
    }

    if (String(req.user._id) === String(userId)) {
      return res.status(400).json({ message: "You cannot suspend your own admin account" });
    }

    const user = await User.findById(userId).select(USER_SAFE_SELECT);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "super_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only a super admin can update another super admin" });
    }

    user.isSuspended = suspend;
    if (suspend) {
      user.security = {
        ...user.security?.toObject?.(),
        sessionVersion: Number(user.security?.sessionVersion || 0) + 1,
      };
    }
    await user.save();

    await createNotification(req.app, {
      userId: user._id,
      actorId: req.user._id,
      type: suspend ? "account_suspended" : "account_reactivated",
      message: suspend
        ? "Your account has been suspended by TickiSpot admin. Contact support for help."
        : "Your account has been reactivated. You can now access TickiSpot again.",
      actionUrl: suspend ? "/support" : "/dashboard",
      entityId: user._id,
      entityType: "User",
      meta: { adminId: req.user._id, adminRole: req.user.role },
    });

    await logAdminActivity(
      req,
      suspend ? "USER_SUSPENDED" : "USER_ACTIVATED",
      "User",
      userId,
      `${user.email} was ${suspend ? "suspended" : "reactivated"}`,
    );

    return res.json({ success: true, user });
  } catch (error) {
    console.error("Error toggling user status:", error);
    return res.status(500).json({ message: "Failed to update user status" });
  }
};

exports.toggleUserVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { verified } = req.body;

    if (typeof verified !== "boolean") {
      return res.status(400).json({ message: "A boolean verified value is required" });
    }

    const user = await User.findById(userId).select(USER_SAFE_SELECT);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isVerified = verified;
    await user.save();

    await logAdminActivity(
      req,
      verified ? "USER_VERIFIED" : "USER_UNVERIFIED",
      "User",
      userId,
      `${user.email} organizer verification set to ${verified}`,
    );

    return res.json({ success: true, user });
  } catch (error) {
    console.error("Error updating user verification:", error);
    return res.status(500).json({ message: "Failed to update verification status" });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestedRole = String(req.body.role || "").trim();

    if (!USER_ROLES.includes(requestedRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (requestedRole === "super_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only a super admin can assign the super_admin role" });
    }

    const user = await User.findById(userId).select(USER_SAFE_SELECT);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "super_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only a super admin can update another super admin" });
    }

    const previousRole = user.role;
    user.role = requestedRole;
    await user.save();

    await logAdminActivity(
      req,
      "USER_ROLE_CHANGED",
      "User",
      userId,
      `${user.email} role changed from ${previousRole} to ${requestedRole}`,
      { previousRole, nextRole: requestedRole },
    );

    return res.json({ success: true, user });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({ message: "Failed to update user role" });
  }
};

exports.updateUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const plan = normalizePlan(req.body.plan);
    const interval = String(req.body.interval || "monthly").trim().toLowerCase() === "yearly" ? "yearly" : "monthly";
    const requestedStatus = String(req.body.status || (plan === "free" ? "inactive" : "active")).trim().toLowerCase();

    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    if (plan === "trial") {
      assignTrialToUser(user);
      await user.save();
    } else {
      await syncUserBillingState({
        user,
        plan,
        interval,
        status: plan === "free" ? "inactive" : requestedStatus,
        reference: `ADMIN-${req.user._id}-${Date.now()}`,
        effectiveDate: new Date(),
      });
    }

    await logAdminActivity(
      req,
      "USER_SUBSCRIPTION_UPDATED",
      "User",
      userId,
      `${user.email} subscription updated to ${plan}/${interval}`,
      { plan, interval, status: requestedStatus },
    );

    return res.json({ success: true, user });
  } catch (error) {
    console.error("Error updating user subscription:", error);
    return res.status(500).json({ message: "Failed to update user subscription" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (String(req.user._id) === String(userId)) {
      return res.status(400).json({ message: "You cannot delete your own admin account" });
    }

    const user = await User.findById(userId).select(USER_SAFE_SELECT);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "super_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only a super admin can delete another super admin" });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    await logAdminActivity(req, "USER_DELETED", "User", userId, `${user.email} account deleted`);
    return res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Failed to delete user" });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const { search, status, featured, visibility, livestream, sort = "newest" } = req.query;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
    const filter = {};

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      const organizerIds = await User.find({
        $or: [{ name: regex }, { username: regex }, { email: regex }],
      }).select("_id");
      filter.$or = [
        { title: regex },
        { category: regex },
        { location: regex },
        { createdBy: { $in: organizerIds.map((item) => item._id) } },
      ];
    }

    if (status) filter.status = status;
    if (visibility) filter.visibility = visibility;
    if (featured === "true" || featured === "false") filter.isFeatured = featured === "true";
    if (livestream === "true" || livestream === "false") filter["liveStream.isLive"] = livestream === "true";

    const sortOption =
      sort === "oldest" ? { createdAt: 1 } : sort === "startDate" ? { startDate: 1, createdAt: -1 } : { createdAt: -1 };

    const [events, total, summaryAgg] = await Promise.all([
      Event.find(filter)
        .populate("createdBy", "name username email isVerified")
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
      Event.aggregate([
        { $match: {} },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
            live: { $sum: { $cond: [{ $eq: ["$liveStream.isLive", true] }, 1, 0] } },
            featured: { $sum: { $cond: [{ $eq: ["$isFeatured", true] }, 1, 0] } },
            private: { $sum: { $cond: [{ $eq: ["$visibility", "private"] }, 1, 0] } },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      events,
      summary: summaryAgg[0] || { total: 0, pending: 0, live: 0, featured: 0, private: 0 },
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ message: "Failed to fetch events" });
  }
};

exports.updateEventStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const status = String(req.body.status || "").trim().toLowerCase();
    const reason = String(req.body.reason || "").trim();

    if (!validateEventStatus(status)) {
      return res.status(400).json({ message: "Invalid event status" });
    }

    const event = await Event.findById(eventId).populate("createdBy", "email name username");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.status = status;
    event.reviewReason = reason;
    event.reviewedAt = new Date();
    event.reviewedBy = req.user._id;
    if (status === "suspended") {
      event.liveStream = {
        ...event.liveStream,
        isLive: false,
      };
    }
    await event.save();

    await Notification.create({
      user: event.createdBy._id,
      title: `Event ${status[0].toUpperCase()}${status.slice(1)}`,
      message:
        status === "approved"
          ? `Your event "${event.title}" has been approved and is now visible on TickiSpot.`
          : `Your event "${event.title}" is now ${status}.${reason ? ` Reason: ${reason}` : ""}`,
      type:
        status === "approved"
          ? "event_approved"
          : status === "rejected"
            ? "event_rejected"
            : "event_update",
      relatedId: event._id,
    });

    await logAdminActivity(
      req,
      `EVENT_${status.toUpperCase()}`,
      "Event",
      eventId,
      reason || `${event.title} marked as ${status}`,
    );

    return res.json({ success: true, event });
  } catch (error) {
    console.error("Error updating event status:", error);
    return res.status(500).json({ message: "Failed to update event status" });
  }
};

exports.toggleEventFeatured = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.isFeatured = !event.isFeatured;
    await event.save();

    await logAdminActivity(
      req,
      event.isFeatured ? "EVENT_FEATURED" : "EVENT_UNFEATURED",
      "Event",
      eventId,
      `${event.title} ${event.isFeatured ? "featured" : "unfeatured"}`,
    );

    return res.json({ success: true, event });
  } catch (error) {
    console.error("Error toggling event featured:", error);
    return res.status(500).json({ message: "Failed to toggle event featured status" });
  }
};

exports.getLivestreamOverview = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 12);
    const filter = { "liveStream.isLive": req.query.live === "all" ? { $in: [true, false] } : true };
    if (req.query.live !== "all") delete filter["liveStream.isLive"].$in;

    const [events, total, summaryAgg] = await Promise.all([
      Event.find(filter)
        .select("title category startDate liveStream analytics ticketsSold createdBy")
        .populate("createdBy", "name username email")
        .sort({ "liveStream.isLive": -1, startDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
      Event.aggregate([
        {
          $group: {
            _id: null,
            totalConfigured: { $sum: { $cond: [{ $ifNull: ["$liveStream.streamType", false] }, 1, 0] } },
            liveNow: { $sum: { $cond: [{ $eq: ["$liveStream.isLive", true] }, 1, 0] } },
            cameraStreams: { $sum: { $cond: [{ $eq: ["$liveStream.streamType", "Camera"] }, 1, 0] } },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      events,
      summary: summaryAgg[0] || { totalConfigured: 0, liveNow: 0, cameraStreams: 0 },
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    console.error("Error fetching livestream overview:", error);
    return res.status(500).json({ message: "Failed to fetch livestream overview" });
  }
};

exports.forceStopLivestream = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).populate("createdBy", "email name username");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.liveStream = {
      ...event.liveStream,
      isLive: false,
    };
    await event.save();

    await createNotification(req.app, {
      userId: event.createdBy._id,
      actorId: req.user._id,
      type: "livestream_stopped",
      message: `Your livestream for "${event.title}" was stopped by a TickiSpot admin.`,
      actionUrl: `/events/${event._id}`,
      entityId: event._id,
      entityType: "Event",
    });

    await logAdminActivity(req, "LIVESTREAM_FORCE_STOPPED", "Event", eventId, `${event.title} livestream stopped`);
    return res.json({ success: true, event });
  } catch (error) {
    console.error("Error stopping livestream:", error);
    return res.status(500).json({ message: "Failed to stop livestream" });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { search, ticketState } = req.query;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
    const normalizedStatus = normalizeTicketStatus(req.query.status);

    if (normalizedStatus === "__unsupported__") {
      return res.json({
        success: true,
        transactions: [],
        summary: { totalTransactions: 0, paidTransactions: 0, freeTransactions: 0, totalRevenue: 0 },
        pagination: buildPagination(page, limit, 0),
      });
    }

    const filter = {};
    const dateRange = buildDateRangeFilter(req.query.startDate, req.query.endDate, "purchasedAt");
    if (dateRange) Object.assign(filter, dateRange);
    if (normalizedStatus) filter.paymentStatus = normalizedStatus;
    if (ticketState) filter.status = ticketState;

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      const [matchingUsers, matchingEvents] = await Promise.all([
        User.find({ $or: [{ name: regex }, { username: regex }, { email: regex }] }).select("_id"),
        Event.find({ title: regex }).select("_id"),
      ]);

      const matchingTickets = await Ticket.find({
        $or: [
          { buyer: { $in: matchingUsers.map((item) => item._id) } },
          { event: { $in: matchingEvents.map((item) => item._id) } },
          { reference: regex },
        ],
      }).select("_id");

      if (!matchingTickets.length) {
        return res.json({
          success: true,
          transactions: [],
          summary: { totalTransactions: 0, paidTransactions: 0, freeTransactions: 0, totalRevenue: 0 },
          pagination: buildPagination(page, limit, 0),
        });
      }

      filter._id = { $in: matchingTickets.map((item) => item._id) };
    }

    const [transactions, total, summaryAgg] = await Promise.all([
      Ticket.find(filter)
        .populate("buyer", "name username email")
        .populate("event", "title category")
        .sort({ purchasedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Ticket.countDocuments(filter),
      Ticket.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            paidTransactions: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } },
            freeTransactions: { $sum: { $cond: [{ $eq: ["$paymentStatus", "free"] }, 1, 0] } },
            totalRevenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$amount", 0] } },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      transactions: transactions.map((ticket) => ({ ...ticket, paymentStatusLabel: ticketStatusLabel(ticket) })),
      summary: summaryAgg[0] || { totalTransactions: 0, paidTransactions: 0, freeTransactions: 0, totalRevenue: 0 },
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

exports.exportTransactions = async (req, res) => {
  try {
    const normalizedStatus = normalizeTicketStatus(req.query.status);
    if (normalizedStatus === "__unsupported__") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="transactions.csv"');
      return res.status(200).send("Reference,Buyer,Buyer Email,Event,Quantity,Amount,Status,Ticket State,Purchased At\n");
    }

    const filter = {};
    const dateRange = buildDateRangeFilter(req.query.startDate, req.query.endDate, "purchasedAt");
    if (dateRange) Object.assign(filter, dateRange);
    if (normalizedStatus) filter.paymentStatus = normalizedStatus;
    if (req.query.ticketState) filter.status = req.query.ticketState;

    if (req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), "i");
      const [matchingUsers, matchingEvents] = await Promise.all([
        User.find({ $or: [{ name: regex }, { username: regex }, { email: regex }] }).select("_id"),
        Event.find({ title: regex }).select("_id"),
      ]);
      const tickets = await Ticket.find({
        $or: [
          { reference: regex },
          { buyer: { $in: matchingUsers.map((user) => user._id) } },
          { event: { $in: matchingEvents.map((event) => event._id) } },
        ],
      }).select("_id");
      filter._id = { $in: tickets.map((ticket) => ticket._id) };
    }

    const transactions = await Ticket.find(filter)
      .populate("buyer", "name username email")
      .populate("event", "title")
      .sort({ purchasedAt: -1 })
      .lean();

    const csv = buildCsv(
      ["Reference", "Buyer", "Buyer Email", "Event", "Quantity", "Amount", "Status", "Ticket State", "Purchased At"],
      transactions.map((ticket) => [
        ticket.reference || "",
        ticket.buyer?.name || ticket.buyer?.username || "",
        ticket.buyer?.email || "",
        ticket.event?.title || "",
        ticket.quantity || 0,
        ticket.amount || 0,
        ticketStatusLabel(ticket),
        ticket.status || "",
        ticket.purchasedAt ? new Date(ticket.purchasedAt).toISOString() : "",
      ]),
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="transactions.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    console.error("Error exporting transactions:", error);
    return res.status(500).json({ message: "Failed to export transactions" });
  }
};

exports.getFinanceOverview = async (req, res) => {
  try {
    const rangeStart = getRangeStart(req.query.days || 30);
    const commissionPercent = getPlatformTicketFeePercent();

    const [
      ticketSalesAgg,
      subscriptionAgg,
      payoutAgg,
      withdrawalFeeAgg,
      failedWithdrawals,
      pendingPayouts,
      monthlyFinance,
    ] = await Promise.all([
      Ticket.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, revenue: { $sum: "$amount" }, tickets: { $sum: "$quantity" } } }]),
      BillingHistory.aggregate([{ $match: { status: "success" } }, { $group: { _id: null, revenue: { $sum: "$amount" }, count: { $sum: 1 } } }]),
      Withdrawal.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Withdrawal.aggregate([{ $group: { _id: null, total: { $sum: "$fee" } } }]),
      Withdrawal.countDocuments({ status: "failed" }),
      Withdrawal.aggregate([{ $match: { status: { $in: ["pending", "approved", "processing"] } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Ticket.aggregate([
        { $match: { paymentStatus: "paid", purchasedAt: { $gte: rangeStart } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$purchasedAt" } },
            ticketRevenue: { $sum: "$amount" },
            ticketsSold: { $sum: "$quantity" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const grossTicketRevenue = ticketSalesAgg[0]?.revenue || 0;
    const platformCommission = Math.round((grossTicketRevenue * commissionPercent) / 100);

    return res.json({
      success: true,
      summary: {
        grossTicketRevenue,
        totalTicketsSold: ticketSalesAgg[0]?.tickets || 0,
        subscriptionRevenue: subscriptionAgg[0]?.revenue || 0,
        subscriptionPayments: subscriptionAgg[0]?.count || 0,
        organizerPayouts: payoutAgg[0]?.total || 0,
        pendingPayouts: pendingPayouts[0]?.total || 0,
        withdrawalFees: withdrawalFeeAgg[0]?.total || 0,
        failedWithdrawals,
        platformCommission,
        netPlatformRevenue: platformCommission + (subscriptionAgg[0]?.revenue || 0) + (withdrawalFeeAgg[0]?.total || 0),
      },
      trend: monthlyFinance,
    });
  } catch (error) {
    console.error("Error fetching finance overview:", error);
    return res.status(500).json({ message: "Failed to fetch finance overview" });
  }
};

exports.getSubscriptionOverview = async (req, res) => {
  try {
    const { search, plan, status } = req.query;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
    const filter = { isDeleted: { $ne: true } };

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: regex }, { username: regex }, { email: regex }];
    }
    if (plan) filter.plan = normalizePlan(plan);
    if (status) filter.subscriptionStatus = status;

    const [users, total, summaryAgg, recentBilling] = await Promise.all([
      User.find(filter)
        .select("name username email role plan subscriptionStatus trialEndsAt billing subscription updatedAt")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
      User.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            free: { $sum: { $cond: [{ $eq: ["$plan", "free"] }, 1, 0] } },
            trial: { $sum: { $cond: [{ $eq: ["$plan", "trial"] }, 1, 0] } },
            pro: { $sum: { $cond: [{ $eq: ["$plan", "pro"] }, 1, 0] } },
            active: { $sum: { $cond: [{ $eq: ["$subscriptionStatus", "active"] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ["$subscriptionStatus", "cancelled"] }, 1, 0] } },
          },
        },
      ]),
      BillingHistory.find({}).populate("userId", "name username email").sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    return res.json({
      success: true,
      users,
      summary: summaryAgg[0] || { free: 0, trial: 0, pro: 0, active: 0, cancelled: 0 },
      recentBilling,
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    console.error("Error fetching subscription overview:", error);
    return res.status(500).json({ message: "Failed to fetch subscription overview" });
  }
};

exports.getModerationOverview = async (req, res) => {
  try {
    const [pendingEvents, suspendedEvents, suspendedUsers, failedWithdrawals, refundedTickets, liveEvents] = await Promise.all([
      Event.find({ status: "pending" }).populate("createdBy", "name username email").sort({ createdAt: -1 }).limit(10).lean(),
      Event.find({ status: "suspended" }).populate("createdBy", "name username email").sort({ reviewedAt: -1, createdAt: -1 }).limit(10).lean(),
      User.find({ isSuspended: true, isDeleted: { $ne: true } }).select("name username email role updatedAt").sort({ updatedAt: -1 }).limit(10).lean(),
      Withdrawal.find({ status: "failed" }).populate("organizer", "name username email").sort({ updatedAt: -1 }).limit(10).lean(),
      Ticket.find({ status: "refunded" }).populate("buyer", "name username email").populate("event", "title").sort({ updatedAt: -1 }).limit(10).lean(),
      Event.find({ "liveStream.isLive": true }).populate("createdBy", "name username email").sort({ updatedAt: -1 }).limit(10).lean(),
    ]);

    return res.json({
      success: true,
      summary: {
        pendingEvents: pendingEvents.length,
        suspendedEvents: suspendedEvents.length,
        suspendedUsers: suspendedUsers.length,
        failedWithdrawals: failedWithdrawals.length,
        refundedTickets: refundedTickets.length,
        liveEvents: liveEvents.length,
      },
      queues: {
        pendingEvents,
        suspendedEvents,
        suspendedUsers,
        failedWithdrawals,
        refundedTickets,
        liveEvents,
      },
    });
  } catch (error) {
    console.error("Error fetching moderation overview:", error);
    return res.status(500).json({ message: "Failed to fetch moderation overview" });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const { action, targetType, search } = req.query;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 50);
    const filter = {};
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ action: regex }, { details: regex }, { targetType: regex }];
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate("adminId", "name username email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      logs,
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return res.status(500).json({ message: "Failed to fetch activity logs" });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const { targetAudience, type } = req.query;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 20);
    const filter = {};
    if (targetAudience) filter.targetAudience = targetAudience;
    if (type) filter.type = type;

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate("author", "name username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Announcement.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      announcements,
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return res.status(500).json({ message: "Failed to fetch announcements" });
  }
};

exports.sendAnnouncement = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const content = String(req.body.content || "").trim();
    const requestedType = String(req.body.type || "info").trim().toLowerCase();
    const targetAudience = String(req.body.targetAudience || "all").trim().toLowerCase();

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const allowedTypes = ["info", "warning", "success", "maintenance"];
    const announcementType = allowedTypes.includes(requestedType) ? requestedType : "info";

    const filter = { isDeleted: { $ne: true } };
    if (targetAudience === "organizers") filter.role = "organizer";
    else if (targetAudience === "buyers") filter.role = "user";
    else if (targetAudience === "admins") filter.role = { $in: ADMIN_ROLES };

    const users = await User.find(filter).select("_id");
    const audienceCount = users.length;

    const announcement = await Announcement.create({
      title,
      content,
      type: announcementType,
      targetAudience,
      author: req.user._id,
      sentTo: audienceCount,
      meta: { issuerId: req.user._id, issuerRole: req.user.role },
    });

    if (audienceCount > 0) {
      const notifications = users.map((user) => ({
        user: user._id,
        actor: req.user._id,
        type: "announcement",
        message: `${title} - ${content}`,
        actionUrl: "/notifications",
        entityId: announcement._id,
        entityType: "Announcement",
        announcementId: announcement._id,
        isAnnouncement: true,
        meta: {
          announcementId: announcement._id,
          title,
          content,
          level: announcementType,
          targetAudience,
        },
      }));

      const insertedNotifications = await Notification.insertMany(notifications);
      const io = req.app.get("io");
      if (io) {
        insertedNotifications.forEach((notification) => {
          io.emitToUser(String(notification.user), "new_notification", notification.toJSON());
        });
      }
    }

    await logAdminActivity(
      req,
      "ANNOUNCEMENT_SENT",
      "Announcement",
      announcement._id,
      `${title} sent to ${targetAudience}`,
      { targetAudience, audienceCount },
    );

    return res.json({
      success: true,
      message: `Announcement sent to ${audienceCount} users`,
      announcementId: announcement._id,
      audienceCount,
    });
  } catch (error) {
    console.error("Error sending announcement:", error);
    return res.status(500).json({ message: "Failed to send announcement" });
  }
};

exports.getAdminSettings = async (req, res) => {
  try {
    const settings = await getOrCreatePlatformSettings();
    return res.json({ success: true, settings });
  } catch (error) {
    console.error("Error loading admin settings:", error);
    return res.status(500).json({ message: "Failed to load admin settings" });
  }
};

exports.updateAdminSettings = async (req, res) => {
  try {
    const settings = await getOrCreatePlatformSettings();
    const updates = req.body || {};

    const numberFields = [
      ["commissionPercent", "commissionPercent"],
      ["withdrawalFeePercent", "withdrawalFeePercent"],
      ["platformLimits.freePlanEventLimit", "platformLimits.freePlanEventLimit"],
      ["platformLimits.maxTeamMembersPerEvent", "platformLimits.maxTeamMembersPerEvent"],
      ["platformLimits.maxFeaturedEvents", "platformLimits.maxFeaturedEvents"],
      ["referrals.rewardAmount", "referrals.rewardAmount"],
    ];

    numberFields.forEach(([inputKey, path]) => {
      const segments = inputKey.split(".");
      let value = updates;
      for (const segment of segments) value = value?.[segment];
      if (value === undefined) return;

      const numericValue = Number(value);
      if (Number.isFinite(numericValue)) {
        settings.set(path, numericValue);
      }
    });

    const booleanFields = [
      ["maintenanceMode", "maintenanceMode"],
      ["eventApprovalRequired", "eventApprovalRequired"],
      ["tickiAiEnabled", "tickiAiEnabled"],
      ["livestreamEnabled", "livestreamEnabled"],
      ["registrationEnabled", "registrationEnabled"],
      ["referrals.enabled", "referrals.enabled"],
    ];

    booleanFields.forEach(([inputKey, path]) => {
      const segments = inputKey.split(".");
      let value = updates;
      for (const segment of segments) value = value?.[segment];
      if (typeof value === "boolean") {
        settings.set(path, value);
      }
    });

    if (typeof updates.homepage?.heroTitle === "string") settings.homepage.heroTitle = updates.homepage.heroTitle.trim();
    if (typeof updates.homepage?.heroSubtitle === "string") settings.homepage.heroSubtitle = updates.homepage.heroSubtitle.trim();
    if (typeof updates.email?.supportEmail === "string") settings.email.supportEmail = updates.email.supportEmail.trim();
    if (typeof updates.email?.operationsEmail === "string") settings.email.operationsEmail = updates.email.operationsEmail.trim();
    if (typeof updates.cloudinary?.cloudName === "string") settings.cloudinary.cloudName = updates.cloudinary.cloudName.trim();
    if (typeof updates.cloudinary?.folder === "string") settings.cloudinary.folder = updates.cloudinary.folder.trim();

    if (Array.isArray(updates.featuredEventIds)) {
      const featuredEventIds = updates.featuredEventIds.map(toObjectId).filter(Boolean);
      settings.featuredEventIds = featuredEventIds;
      await Event.updateMany({}, { $set: { isFeatured: false } });
      if (featuredEventIds.length) {
        await Event.updateMany({ _id: { $in: featuredEventIds } }, { $set: { isFeatured: true } });
      }
    }

    await settings.save();

    await logAdminActivity(req, "SETTING_CHANGED", "Setting", settings._id, "Platform settings updated");
    return res.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating admin settings:", error);
    return res.status(500).json({ message: "Failed to update admin settings" });
  }
};
