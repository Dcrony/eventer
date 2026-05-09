const User = require("../models/User");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const Transaction = require("../models/Transaction");
const BillingHistory = require("../models/BillingHistory");
const Withdrawal = require("../models/Withdrawal");
const Notification = require("../models/Notification");
const ActivityLog = require("../models/ActivityLog");

/**
 * Platform Dashboard Stats
 * Returns high-level metrics for admin overview
 */
exports.getPlatformStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // User metrics
    const totalUsers = await User.countDocuments();
    const totalOrganizers = await User.countDocuments({ role: "organizer" });
    const activeUsers = await User.countDocuments({ updatedAt: { $gte: thirtyDaysAgo } });
    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const suspendedUsers = await User.countDocuments({ isSuspended: true });

    // Event metrics
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ status: "approved" });
    const pendingEvents = await Event.countDocuments({ status: "pending" });
    const liveEvents = await Event.countDocuments({ "liveStream.isLive": true });

    // Ticket metrics
    const totalTicketsSold = await Ticket.aggregate([
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);
    const ticketsThisMonth = await Ticket.aggregate([
      { $match: { purchasedAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);

    // Revenue metrics
    const totalRevenue = await Ticket.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const revenueThisMonth = await Ticket.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          purchasedAt: { $gte: thirtyDaysAgo },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Platform stats
    const stats = {
      users: {
        total: totalUsers,
        organizers: totalOrganizers,
        active: activeUsers,
        new: newUsers,
        suspended: suspendedUsers,
      },
      events: {
        total: totalEvents,
        approved: activeEvents,
        pending: pendingEvents,
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
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    res.status(500).json({ message: "Failed to fetch platform stats" });
  }
};

/**
 * Get Revenue Analytics
 */
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Daily revenue
    const dailyRevenue = await Ticket.aggregate([
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
    ]);

    // Payment method breakdown
    const paymentMethods = await Ticket.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          purchasedAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        daily: dailyRevenue,
        paymentMethods,
      },
    });
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    res.status(500).json({ message: "Failed to fetch revenue analytics" });
  }
};

/**
 * Get All Users with Pagination
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }
    if (role) filter.role = role;
    if (status === "suspended") filter.isSuspended = true;
    if (status === "active") filter.isSuspended = false;

    const users = await User.find(filter)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

/**
 * Get Single User Details
 */
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password").populate({
      path: "favorites",
      select: "title image startDate category",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's events
    const userEvents = await Event.find({ createdBy: userId }).select("title status ticketsSold revenue");

    // Get user's transactions
    const userTransactions = await Ticket.find({ buyer: userId }).populate("event", "title");

    res.json({
      success: true,
      user,
      events: userEvents,
      transactions: userTransactions,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
};

/**
 * Suspend/Reactivate User
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { suspend } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isSuspended: suspend },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log activity
    await logAdminActivity(req.user._id, suspend ? "USER_SUSPENDED" : "USER_ACTIVATED", "User", userId);

    res.json({ success: true, user });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ message: "Failed to update user status" });
  }
};

/**
 * Get All Events with Pagination
 */
exports.getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, featured } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }
    if (status) filter.status = status;
    if (featured) filter.isFeatured = featured === "true";

    const events = await Event.find(filter)
      .populate("createdBy", "name email")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};

/**
 * Approve/Reject Event
 */
exports.updateEventStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, reason } = req.body;

    const event = await Event.findByIdAndUpdate(
      eventId,
      { status },
      { new: true },
    ).populate("createdBy", "email name");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Send notification to organizer
    if (status === "approved") {
      await Notification.create({
        user: event.createdBy._id,
        title: "Event Approved",
        message: `Your event "${event.title}" has been approved and is now live`,
        type: "event_approved",
        relatedId: event._id,
      });
    } else if (status === "rejected") {
      await Notification.create({
        user: event.createdBy._id,
        title: "Event Rejected",
        message: `Your event "${event.title}" was rejected. Reason: ${reason || "See admin message"}`,
        type: "event_rejected",
        relatedId: event._id,
      });
    }

    // Log activity
    await logAdminActivity(req.user._id, `EVENT_${status.toUpperCase()}`, "Event", eventId, reason);

    res.json({ success: true, event });
  } catch (error) {
    console.error("Error updating event status:", error);
    res.status(500).json({ message: "Failed to update event status" });
  }
};

/**
 * Toggle Event Featured Status
 */
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
      req.user._id,
      event.isFeatured ? "EVENT_FEATURED" : "EVENT_UNFEATURED",
      "Event",
      eventId,
    );

    res.json({ success: true, event });
  } catch (error) {
    console.error("Error toggling event featured:", error);
    res.status(500).json({ message: "Failed to toggle event featured status" });
  }
};

/**
 * Get Transactions
 */
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.paymentStatus = status;
    if (startDate || endDate) {
      filter.purchasedAt = {};
      if (startDate) filter.purchasedAt.$gte = new Date(startDate);
      if (endDate) filter.purchasedAt.$lte = new Date(endDate);
    }

    const transactions = await Ticket.find(filter)
      .populate("buyer", "name email")
      .populate("event", "title")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ purchasedAt: -1 });

    const total = await Ticket.countDocuments(filter);

    res.json({
      success: true,
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

/**
 * Get Activity Logs
 */
exports.getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (action) filter.action = action;

    const logs = await ActivityLog.find(filter)
      .populate("adminId", "name email")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await ActivityLog.countDocuments(filter);

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ message: "Failed to fetch activity logs" });
  }
};

/**
 * Send Platform Announcement
 */
exports.sendAnnouncement = async (req, res) => {
  try {
    const { title, content, type, targetAudience } = req.body;

    let filter = {};
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

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Log activity
    await logAdminActivity(req.user._id, "ANNOUNCEMENT_SENT", "Announcement", null, title);

    res.json({ success: true, message: `Announcement sent to ${notifications.length} users` });
  } catch (error) {
    console.error("Error sending announcement:", error);
    res.status(500).json({ message: "Failed to send announcement" });
  }
};

/**
 * Get Platform Metrics
 */
exports.getPlatformMetrics = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User growth
    const userGrowth = await User.aggregate([
      {
        $match: { createdAt: { $gte: thirtyDaysAgo } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Event creation trends
    const eventTrends = await Event.aggregate([
      {
        $match: { createdAt: { $gte: thirtyDaysAgo } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $sum: [
                {
                  $cond: [{ $eq: ["$status", "approved"] }, 1, 0],
                },
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      metrics: {
        userGrowth,
        eventTrends,
      },
    });
  } catch (error) {
    console.error("Error fetching platform metrics:", error);
    res.status(500).json({ message: "Failed to fetch platform metrics" });
  }
};

/**
 * Helper: Log Admin Activity
 */
async function logAdminActivity(adminId, action, targetType, targetId = null, details = null) {
  try {
    // Create ActivityLog if model exists
    if (ActivityLog) {
      await ActivityLog.create({
        adminId,
        action,
        targetType,
        targetId,
        details,
        ipAddress: null, // Can be added from req
        timestamp: new Date(),
      });
    }
  } catch (error) {
    console.error("Failed to log admin activity:", error);
  }
}
