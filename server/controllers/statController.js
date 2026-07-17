const mongoose = require("mongoose");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Withdrawal = require("../models/Withdrawal");
const Payout = require("../models/Payout");
const { getPlatformTicketFeePercent } = require("../utils/platformFee");
const { capOrganizerAvailableBalance } = require("../utils/organizerBalance");
const { isAdminRole } = require("../middleware/adminAccess");
const smartPayoutService = require("../services/smartPayoutService");

const buildDateKey = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
};

const normalizeStartOfDay = (date) => {
  const result = date instanceof Date ? new Date(date) : new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const calculateGrowth = (current, previous) => {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);
  if (previousValue === 0) {
    return currentValue === 0 ? 0 : 100;
  }
  return Math.round(((currentValue - previousValue) / previousValue) * 100);
};

exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const user = await User.findById(userId);

    const events = await Event.find({ createdBy: userId });
    const eventIds = events.map((event) => event._id);

    const tickets = await Ticket.find({ event: { $in: eventIds } }).populate(
      "buyer",
      "username email",
    );

    const totalTicketsSold = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    const totalRevenue = tickets.reduce((sum, ticket) => sum + (ticket.amountPaid || 0), 0);
    const currentlyLive = events.filter((event) => event.liveStream?.isLive).length;

    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonthEnd = new Date(currentMonthStart);
    previousMonthEnd.setMilliseconds(-1);

    const currentMonthTickets = tickets.filter((ticket) => {
      const purchasedAt = ticket.purchasedAt ? new Date(ticket.purchasedAt) : null;
      return purchasedAt && purchasedAt >= currentMonthStart;
    });
    const previousMonthTickets = tickets.filter((ticket) => {
      const purchasedAt = ticket.purchasedAt ? new Date(ticket.purchasedAt) : null;
      return purchasedAt && purchasedAt >= previousMonthStart && purchasedAt <= previousMonthEnd;
    });

    const currentMonthEvents = events.filter((event) => new Date(event.createdAt) >= currentMonthStart);
    const previousMonthEvents = events.filter((event) => {
      const createdAt = new Date(event.createdAt);
      return createdAt >= previousMonthStart && createdAt <= previousMonthEnd;
    });

    const currentMonthTicketsSold = currentMonthTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    const previousMonthTicketsSold = previousMonthTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    const currentMonthRevenue = currentMonthTickets.reduce((sum, ticket) => sum + (ticket.amountPaid || 0), 0);
    const previousMonthRevenue = previousMonthTickets.reduce((sum, ticket) => sum + (ticket.amountPaid || 0), 0);

    const ticketsSoldTrend = calculateGrowth(currentMonthTicketsSold, previousMonthTicketsSold);
    const revenueTrend = calculateGrowth(currentMonthRevenue, previousMonthRevenue);
    const eventsCreatedTrend = calculateGrowth(currentMonthEvents.length, previousMonthEvents.length);

    const sparkStart = normalizeStartOfDay(new Date(today));
    sparkStart.setDate(sparkStart.getDate() - 6);
    const ticketSalesSpark = Array.from({ length: 7 }, () => 0);

    tickets.forEach((ticket) => {
      const purchasedAt = ticket.purchasedAt ? new Date(ticket.purchasedAt) : null;
      if (!purchasedAt || purchasedAt < sparkStart) return;
      const dayIndex = Math.floor((normalizeStartOfDay(purchasedAt) - sparkStart) / (24 * 60 * 60 * 1000));
      if (dayIndex >= 0 && dayIndex < ticketSalesSpark.length) {
        ticketSalesSpark[dayIndex] += ticket.quantity;
      }
    });

    const perEventStats = events.map((event) => {
      const eventTickets = tickets.filter(
        (ticket) => ticket.event.toString() === event._id.toString(),
      );

      const sold = eventTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
      const rev = eventTickets.reduce((sum, ticket) => sum + (ticket.amountPaid || 0), 0);

      return {
        id: event._id,
        title: event.title,
        image: event.image,
        startDate: event.startDate,
        category: event.category,
        location: event.location,
        viewCount: Number(event.viewCount || 0),
        eventType: event.eventType,
        ticketsSold: sold,
        revenue: rev,
        attendees: eventTickets.map((ticket) => ({
          buyer: ticket.buyer,
          quantity: ticket.quantity,
        })),
      };
    });

    const topEvents = [...perEventStats]
      .sort((left, right) => right.ticketsSold - left.ticketsSold)
      .slice(0, 5);

    const rawAvailable = Number(user?.availableBalance) || 0;
    const availableBalance =
      userRole === "organizer"
        ? await capOrganizerAvailableBalance(userId, rawAvailable)
        : rawAvailable;

    const response = {
      totalEvents: events.length,
      totalTicketsSold,
      totalRevenue,
      currentlyLive,
      topEvents,
      perEventStats,
      availableBalance,
      pendingBalance: user?.pendingBalance || 0,
      currentMonthTicketsSold,
      currentMonthRevenue,
      ticketSalesSpark,
      ticketsSoldTrend,
      revenueTrend,
      eventsCreatedTrend,
    };

    if (isAdminRole(userRole)) {
      const totalUsers = await User.countDocuments();
      const organizers = await User.countDocuments({ role: "organizer" });
      const buyers = await User.countDocuments({ role: "user" });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeUsers = await User.countDocuments({
        updatedAt: { $gte: thirtyDaysAgo },
      });

      response.totalUsers = totalUsers;
      response.organizers = organizers;
      response.buyers = buyers;
      response.activeUsers = activeUsers;
    }

    const purchasedTickets = await Ticket.find({ buyer: userId })
      .populate("event", "title image startDate location category eventType")
      .sort({ purchasedAt: -1 })
      .lean();

    const totalSpentAsAttendee = purchasedTickets.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
    const totalTicketsAsAttendee = purchasedTickets.reduce((sum, t) => sum + (t.quantity || 0), 0);

    response.attendee = {
      totalPurchases: purchasedTickets.length,
      totalTickets: totalTicketsAsAttendee,
      totalSpent: totalSpentAsAttendee,
      recentPurchases: purchasedTickets.slice(0, 50).map((t) => ({
        ticketId: t._id,
        quantity: t.quantity,
        amount: t.amountPaid,
        ticketType: t.ticketType,
        purchasedAt: t.purchasedAt,
        event: t.event
          ? {
              _id: t.event._id,
              title: t.event.title,
              image: t.event.image,
              startDate: t.event.startDate,
              location: t.event.location,
              category: t.event.category,
              eventType: t.event.eventType,
            }
          : null,
      })),
    };

    res.status(200).json(response);
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ message: "Failed to get stats" });
  }
};

/**
 * Organizer earnings: gross ticket sales, platform % on sales, balances, withdrawal stats.
 * availableBalance is capped to net ticket proceeds minus completed withdrawals.
 */
exports.getOrganizerEarnings = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const events = await Event.find({ createdBy: userId }).lean();
    const eventIds = events.map((e) => e._id);

    const tickets =
      eventIds.length === 0 ? [] : await Ticket.find({ event: { $in: eventIds } }).lean();

    const grossTicketSales = tickets.reduce((sum, t) => sum + (Number(t.amountPaid) || 0), 0);
    const totalPlatformFees = tickets.reduce((sum, t) => sum + (Number(t.platformFee) || 0), 0);
    const platformTicketFeePct = getPlatformTicketFeePercent();
    const platformCommissionOnSales = totalPlatformFees;
    const netAfterSalesCommission = Math.max(0, grossTicketSales - platformCommissionOnSales);

    const oid = new mongoose.Types.ObjectId(userId);

    const withdrawalTotals = await Withdrawal.aggregate([
      { $match: { organizer: oid, status: { $in: ["completed", "PAID"] } } },
      { $group: { _id: null, total: { $sum: "$amount" }, totalFees: { $sum: "$fee" } } },
    ]);
    const totalWithdrawn = withdrawalTotals[0]?.total || 0;
    const totalWithdrawalProcessingFees = withdrawalTotals[0]?.totalFees || 0;

    const pendingWithdrawals = await Withdrawal.aggregate([
      { $match: { organizer: oid, status: { $in: ["pending", "PENDING_ADMIN_APPROVAL", "approved", "processing", "PROCESSING"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const pendingWithdrawalAmount = pendingWithdrawals[0]?.total || 0;

    const effectiveOrganizerLevel = smartPayoutService.getEffectiveOrganizerLevel(user);
    const organizerPolicy = smartPayoutService.getOrganizerPayoutPolicy({
      organizerLevel: effectiveOrganizerLevel,
      isVerified: user.isVerified,
      earlyPayoutEnabled: user.earlyPayoutEnabled,
    });

    const payoutTotalsAgg = await Payout.aggregate([
      { $match: { organizer: oid } },
      {
        $group: {
          _id: null,
          totalPayouts: { $sum: 1 },
          pendingPayouts: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
          processingPayouts: { $sum: { $cond: [{ $eq: ["$status", "PROCESSING"] }, 1, 0] } },
          paidPayouts: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] } },
          failedPayouts: { $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] } },
          reversedPayouts: { $sum: { $cond: [{ $eq: ["$status", "REVERSED"] }, 1, 0] } },
          totalPaidAmount: { $sum: { $cond: [{ $in: ["$state", ["released", "completed"]] }, "$netAmount", 0] } },
          pendingHeldAmount: { $sum: { $cond: [{ $in: ["$state", ["pending", "processing", "scheduled", "under_review"]] }, "$netAmount", 0] } },
        },
      },
    ]);

    const recentPayouts = await Payout.find({ organizer: oid })
      .populate("event", "title startDate endDate")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const nextAutomaticPayout = await Payout.findOne({
      organizer: oid,
      state: { $in: ["pending", "scheduled"] },
      releaseAfter: { $gt: new Date() },
    })
      .sort({ releaseAfter: 1 })
      .select("releaseAfter state status netAmount payoutType")
      .lean();

    const perEvent = events
      .map((event) => {
        const evTickets = tickets.filter((t) => t.event.toString() === event._id.toString());
        const revenue = evTickets.reduce((s, t) => s + (Number(t.amountPaid) || 0), 0);
        const platformCommission = evTickets.reduce((s, t) => s + (Number(t.platformFee) || 0), 0);
        const eligibleRevenue = Math.max(0, revenue - platformCommission);
        const availableEarlyPayout = smartPayoutService.calculateEarlyPayoutAmount(
          Math.max(0, eligibleRevenue - Number(event.earlyPayoutAmount || 0)),
          organizerPolicy.allowedEarlyPercent,
        );
        return {
          eventId: event._id,
          title: event.title,
          image: event.image,
          startDate: event.startDate,
          grossRevenue: revenue,
          platformCommission,
          netEarnings: eligibleRevenue,
          ticketsSold: evTickets.reduce((s, t) => s + (Number(t.quantity) || 0), 0),
          payoutStatus: event.payoutStatus || "PENDING",
          remainingBalance: Number(event.remainingBalance || 0),
          eligibleForEarlyPayout: Boolean(event.eligibleForEarlyPayout),
          organizerLevel: organizerPolicy.organizerLevel,
          maxEarlyPayoutPercent: organizerPolicy.allowedEarlyPercent,
          availableEarlyPayout,
        };
      })
      .sort((a, b) => b.grossRevenue - a.grossRevenue);

    const withdrawalProcessingFeePercent = Number(process.env.WITHDRAWAL_PROCESSING_FEE_PERCENT || 2);
    const minWithdrawalAmount = Number(process.env.MIN_WITHDRAWAL_NGN || 1000);

    const rawAvailable = Number(user.availableBalance) || 0;
    const availableBalance = await capOrganizerAvailableBalance(userId, rawAvailable);
    const payoutTotals = payoutTotalsAgg[0] || {};

    res.status(200).json({
      grossTicketSales,
      platformTicketFeePercent: platformTicketFeePct,
      platformCommissionOnSales,
      netAfterSalesCommission,
      availableBalance,
      pendingBalance: Number(user.pendingBalance) || 0,
      remainingHeldBalance: Number(payoutTotals.pendingHeldAmount || 0),
      totalPaid: Number(payoutTotals.totalPaidAmount || 0),
      pendingPayout: Number(payoutTotals.pendingHeldAmount || 0),
      pendingPayoutCount: Number(payoutTotals.pendingPayouts || 0),
      totalPayouts: Number(payoutTotals.totalPayouts || 0),
      organizerLevel: effectiveOrganizerLevel,
      trustScore: Number(user.trustScore || 0),
      earlyPayoutEnabled: Boolean(user.earlyPayoutEnabled),
      availableEarlyPayout: perEvent.reduce((sum, event) => sum + Number(event.availableEarlyPayout || 0), 0),
      totalWithdrawn,
      totalWithdrawalProcessingFeesCharged: totalWithdrawalProcessingFees,
      pendingWithdrawalAmount,
      withdrawalProcessingFeePercent,
      minWithdrawalAmount,
      nextAutomaticPayoutAt: nextAutomaticPayout?.releaseAfter || null,
      payoutStatus: {
        pending: Number(payoutTotals.pendingPayouts || 0),
        processing: Number(payoutTotals.processingPayouts || 0),
        paid: Number(payoutTotals.paidPayouts || 0),
        failed: Number(payoutTotals.failedPayouts || 0),
        reversed: Number(payoutTotals.reversedPayouts || 0),
      },
      perEvent,
      payoutHistory: recentPayouts,
      organizerPolicy,
    });
  } catch (err) {
    console.error("Organizer earnings error:", err);
    res.status(500).json({ message: "Failed to load earnings" });
  }
};
