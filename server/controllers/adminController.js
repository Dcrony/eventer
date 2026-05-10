const User = require("../models/User");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const Withdrawal = require("../models/Withdrawal");
const Notification = require("../models/Notification");
const ActivityLog = require("../models/ActivityLog");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

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
    const parsedStart = new Date(startDate);
    if (!Number.isNaN(parsedStart.getTime())) {
      range.$gte = parsedStart;
    }
  }

  if (endDate) {
    const parsedEnd = new Date(endDate);
    if (!Number.isNaN(parsedEnd.getTime())) {
      parsedEnd.setHours(23, 59, 59, 999);
      range.$lte = parsedEnd;
    }
  }

  if (!Object.keys(range).length) return null;

  return { [key]: range };
};

const normalizeTicketStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "success") return "paid";
  if (normalized === "failed" || normalized === "pending") return "__unsupported__";
  return normalized;
};

const ticketStatusLabel = (ticket) => (ticket?.paymentStatus === "paid" ? "success" : "free");

const formatCsvValue = (value) => {
  const safe = String(value ?? "");
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const buildCsv = (headers, rows) => {
  const lines = [headers, ...rows].map((row) => row.map(formatCsvValue).join(","));
  return lines.join("\n");
};

const validateEventStatus = (status) => ["approved", "rejected", "pending"].includes(status);

async function logAdminActivity(req, action, targetType, targetId = null, details = null) {
  try {
    await ActivityLog.create({
      adminId: req.user._id,
      action,
      targetType,
      targetId,
      details,
      ipAddress: req.ip || null,
    });
  } catch (error) {
    console.error("Failed to log admin activity:", error);
  }
}

exports.getPlatformStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalOrganizers,
      activeUsers,
      newUsers,
      suspendedUsers,
      totalEvents,
      approvedEvents,
      pendingEvents,
      rejectedEvents,
      featuredEvents,
      liveEvents,
      totalTicketsSold,
      ticketsThisMonth,
      totalRevenue,
      revenueThisMonth,
      recentTransactions,
      recentWithdrawals,
      recentActivities,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ role: "organizer", isDeleted: { $ne: true } }),
      User.countDocuments({ updatedAt: { $gte: thirtyDaysAgo }, isDeleted: { $ne: true } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, isDeleted: { $ne: true } }),
      User.countDocuments({ isSuspended: true, isDeleted: { $ne: true } }),
      Event.countDocuments(),
      Event.countDocuments({ status: "approved" }),
      Event.countDocuments({ status: "pending" }),
      Event.countDocuments({ status: "rejected" }),
      Event.countDocuments({ isFeatured: true }),
      Event.countDocuments({ "liveStream.isLive": true }),
      Ticket.aggregate([{ $group: { _id: null, total: { $sum: "$quantity" } } }]),
      Ticket.aggregate([
        { $match: { purchasedAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]),
      Ticket.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Ticket.aggregate([
        { $match: { paymentStatus: "paid", purchasedAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Ticket.find()
        .populate("buyer", "name username email")
        .populate("event", "title")
        .sort({ purchasedAt: -1 })
        .limit(5)
        .lean(),
      Withdrawal.find()
        .populate("organizer", "name username email")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      ActivityLog.find()
        .populate("adminId", "name username email")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    return res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          organizers: totalOrganizers,
          active: activeUsers,
          new: newUsers,
          suspended: suspendedUsers,
        },
        events: {
          total: totalEvents,
          approved: approvedEvents,
          pending: pendingEvents,
          rejected: rejectedEvents,
          featured: featuredEvents,
          live: liveEvents,
        },
        tickets: {
          total: totalTicketsSold[0]?.total || 0,
          thisMonth: ticketsThisMonth[0]?.total || 0,
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          thisMonth: revenueThisMonth[0]?.total || 0,
        },
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
    const start = req.query.startDate
      ? new Date(req.query.startDate)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = req.query.endDate ? new Date(req.query.endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const [dailyRevenue, paymentMethods, totals] = await Promise.all([
      Ticket.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            purchasedAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$purchasedAt" } },
            revenue: { $sum: "$amount" },
            ticketsSold: { $sum: "$quantity" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Ticket.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            purchasedAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: "$ticketType",
            total: { $sum: "$amount" },
            count: { $sum: "$quantity" },
          },
        },
        { $sort: { total: -1 } },
      ]),
      Ticket.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            purchasedAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            totalTickets: { $sum: "$quantity" },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        daily: dailyRevenue,
        paymentMethods,
        summary: totals[0] || { totalRevenue: 0, totalTickets: 0 },
      },
    });
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    return res.status(500).json({ message: "Failed to fetch revenue analytics" });
  }
};

exports.getPlatformMetrics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [userGrowth, eventTrends, transactionTrends, withdrawalTrends] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Event.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            approved: {
              $sum: {
                $cond: [{ $eq: ["$status", "approved"] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Ticket.aggregate([
        { $match: { purchasedAt: { $gte: thirtyDaysAgo }, paymentStatus: "paid" } },
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
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            amount: { $sum: "$amount" },
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
      },
    });
  } catch (error) {
    console.error("Error fetching platform metrics:", error);
    return res.status(500).json({ message: "Failed to fetch platform metrics" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);

    const filter = { isDeleted: { $ne: true } };

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: regex }, { email: regex }, { username: regex }];
    }

    if (role) {
      filter.role = role;
    }

    if (status === "suspended") {
      filter.isSuspended = true;
    } else if (status === "active") {
      filter.isSuspended = false;
    }

    const [users, total, summaryAgg] = await Promise.all([
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
      User.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            admins: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } },
            organizers: { $sum: { $cond: [{ $eq: ["$role", "organizer"] }, 1, 0] } },
            suspended: { $sum: { $cond: [{ $eq: ["$isSuspended", true] }, 1, 0] } },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      users,
      summary: summaryAgg[0] || { total: 0, admins: 0, organizers: 0, suspended: 0 },
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
    const user = await User.findById(userId).select("-password").populate({
      path: "favorites",
      select: "title image startDate category",
    });

    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    const [events, transactions] = await Promise.all([
      Event.find({ createdBy: userId }).select(
        "title category status isFeatured ticketsSold totalTickets startDate createdAt",
      ),
      Ticket.find({ buyer: userId })
        .populate("event", "title category")
        .sort({ purchasedAt: -1 })
        .limit(20),
    ]);

    return res.json({
      success: true,
      user,
      events,
      transactions,
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

    const user = await User.findByIdAndUpdate(
      userId,
      { isSuspended: suspend },
      { new: true },
    ).select("-password");

    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

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

exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["admin", "organizer", "user"].includes(String(role || "").trim())) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    await logAdminActivity(
      req,
      "USER_ROLE_CHANGED",
      "User",
      userId,
      `${user.email} role changed from ${previousRole} to ${role}`,
    );

    return res.json({ success: true, user });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({ message: "Failed to update user role" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (String(req.user._id) === String(userId)) {
      return res.status(400).json({ message: "You cannot delete your own admin account" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
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
    const { search, status, featured } = req.query;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);

    const filter = {};

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ title: regex }, { category: regex }, { location: regex }];
    }

    if (status) {
      filter.status = status;
    }

    if (featured === "true" || featured === "false") {
      filter.isFeatured = featured === "true";
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("createdBy", "name username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      events,
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
    await event.save();

    if (status === "approved" || status === "rejected") {
      await Notification.create({
        user: event.createdBy._id,
        title: status === "approved" ? "Event Approved" : "Event Rejected",
        message:
          status === "approved"
            ? `Your event "${event.title}" has been approved and is now visible on TickiSpot.`
            : `Your event "${event.title}" was rejected.${reason ? ` Reason: ${reason}` : ""}`,
        type: status === "approved" ? "event_approved" : "event_rejected",
        relatedId: event._id,
      });
    }

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

exports.getTransactions = async (req, res) => {
  try {
    const { search } = req.query;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
    const normalizedStatus = normalizeTicketStatus(req.query.status);

    if (normalizedStatus === "__unsupported__") {
      return res.json({
        success: true,
        transactions: [],
        summary: {
          totalTransactions: 0,
          paidTransactions: 0,
          freeTransactions: 0,
          totalRevenue: 0,
        },
        pagination: buildPagination(page, limit, 0),
      });
    }

    const filter = {};
    const dateRange = buildDateRangeFilter(req.query.startDate, req.query.endDate, "purchasedAt");
    if (dateRange) Object.assign(filter, dateRange);
    if (normalizedStatus) filter.paymentStatus = normalizedStatus;

    let ticketIds = null;
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      const [matchingUsers, matchingEvents] = await Promise.all([
        User.find({
          $or: [{ name: regex }, { username: regex }, { email: regex }],
        }).select("_id"),
        Event.find({ title: regex }).select("_id"),
      ]);

      const userIds = matchingUsers.map((user) => user._id);
      const eventIds = matchingEvents.map((event) => event._id);

      const idFilters = [];
      if (userIds.length) idFilters.push({ buyer: { $in: userIds } });
      if (eventIds.length) idFilters.push({ event: { $in: eventIds } });
      idFilters.push({ reference: regex });

      const matchingTickets = await Ticket.find({ $or: idFilters }).select("_id");
      ticketIds = matchingTickets.map((ticket) => ticket._id);

      if (!ticketIds.length) {
        return res.json({
          success: true,
          transactions: [],
          summary: {
            totalTransactions: 0,
            paidTransactions: 0,
            freeTransactions: 0,
            totalRevenue: 0,
          },
          pagination: buildPagination(page, limit, 0),
        });
      }

      filter._id = { $in: ticketIds };
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
            paidTransactions: {
              $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] },
            },
            freeTransactions: {
              $sum: { $cond: [{ $eq: ["$paymentStatus", "free"] }, 1, 0] },
            },
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$amount", 0],
              },
            },
          },
        },
      ]),
    ]);

    const mappedTransactions = transactions.map((ticket) => ({
      ...ticket,
      paymentStatusLabel: ticketStatusLabel(ticket),
    }));

    return res.json({
      success: true,
      transactions: mappedTransactions,
      summary:
        summaryAgg[0] || {
          totalTransactions: 0,
          paidTransactions: 0,
          freeTransactions: 0,
          totalRevenue: 0,
        },
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
      return res.status(200).send("Reference,Buyer,Buyer Email,Event,Quantity,Amount,Status,Purchased At\n");
    }

    const filter = {};
    const dateRange = buildDateRangeFilter(req.query.startDate, req.query.endDate, "purchasedAt");
    if (dateRange) Object.assign(filter, dateRange);
    if (normalizedStatus) filter.paymentStatus = normalizedStatus;

    if (req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), "i");
      const [matchingUsers, matchingEvents] = await Promise.all([
        User.find({
          $or: [{ name: regex }, { username: regex }, { email: regex }],
        }).select("_id"),
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
      ["Reference", "Buyer", "Buyer Email", "Event", "Quantity", "Amount", "Status", "Purchased At"],
      transactions.map((ticket) => [
        ticket.reference || "",
        ticket.buyer?.name || ticket.buyer?.username || "",
        ticket.buyer?.email || "",
        ticket.event?.title || "",
        ticket.quantity || 0,
        ticket.amount || 0,
        ticketStatusLabel(ticket),
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

exports.getActivityLogs = async (req, res) => {
  try {
    const { action } = req.query;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 50);

    const filter = {};
    if (action) {
      filter.action = action;
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate("adminId", "name username email")
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

exports.sendAnnouncement = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const content = String(req.body.content || "").trim();
    const type = String(req.body.type || "info").trim().toLowerCase();
    const targetAudience = String(req.body.targetAudience || "all").trim().toLowerCase();

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const filter = { isDeleted: { $ne: true } };
    if (targetAudience === "organizers") {
      filter.role = "organizer";
    } else if (targetAudience === "buyers") {
      filter.role = "user";
    }

    const users = await User.find(filter).select("_id");
    const notifications = users.map((user) => ({
      user: user._id,
      title,
      message: content,
      type: `announcement_${type}`,
      isAnnouncement: true,
    }));

    if (notifications.length) {
      await Notification.insertMany(notifications);
    }

    await logAdminActivity(
      req,
      "ANNOUNCEMENT_SENT",
      "Announcement",
      null,
      `${title} sent to ${targetAudience}`,
    );

    return res.json({
      success: true,
      message: `Announcement sent to ${notifications.length} users`,
    });
  } catch (error) {
    console.error("Error sending announcement:", error);
    return res.status(500).json({ message: "Failed to send announcement" });
  }
};
