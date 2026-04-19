const mongoose = require("mongoose");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Withdrawal = require("../models/Withdrawal");
const { getPlatformTicketFeePercent } = require("../utils/platformFee");
const { capOrganizerAvailableBalance } = require("../utils/organizerBalance");

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
    const totalRevenue = tickets.reduce((sum, ticket) => sum + (ticket.amount || 0), 0);
    const currentlyLive = events.filter((event) => event.liveStream?.isLive).length;

    const perEventStats = events.map((event) => {
      const eventTickets = tickets.filter(
        (ticket) => ticket.event.toString() === event._id.toString(),
      );

      const sold = eventTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
      const rev = eventTickets.reduce((sum, ticket) => sum + (ticket.amount || 0), 0);

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
    };

    if (userRole === "admin") {
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

    const totalSpentAsAttendee = purchasedTickets.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalTicketsAsAttendee = purchasedTickets.reduce((sum, t) => sum + (t.quantity || 0), 0);

    response.attendee = {
      totalPurchases: purchasedTickets.length,
      totalTickets: totalTicketsAsAttendee,
      totalSpent: totalSpentAsAttendee,
      recentPurchases: purchasedTickets.slice(0, 50).map((t) => ({
        ticketId: t._id,
        quantity: t.quantity,
        amount: t.amount,
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

    const grossTicketSales = tickets.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const platformTicketFeePct = getPlatformTicketFeePercent();
    const platformCommissionOnSales = Math.round((grossTicketSales * platformTicketFeePct) / 100);
    const netAfterSalesCommission = grossTicketSales - platformCommissionOnSales;

    const oid = new mongoose.Types.ObjectId(userId);

    const withdrawalTotals = await Withdrawal.aggregate([
      { $match: { organizer: oid, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" }, totalFees: { $sum: "$fee" } } },
    ]);
    const totalWithdrawn = withdrawalTotals[0]?.total || 0;
    const totalWithdrawalProcessingFees = withdrawalTotals[0]?.totalFees || 0;

    const pendingWithdrawals = await Withdrawal.aggregate([
      { $match: { organizer: oid, status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const pendingWithdrawalAmount = pendingWithdrawals[0]?.total || 0;

    const perEvent = events
      .map((event) => {
        const evTickets = tickets.filter((t) => t.event.toString() === event._id.toString());
        const revenue = evTickets.reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const commission = Math.round((revenue * platformTicketFeePct) / 100);
        return {
          eventId: event._id,
          title: event.title,
          image: event.image,
          startDate: event.startDate,
          grossRevenue: revenue,
          platformCommission: commission,
          netEarnings: revenue - commission,
          ticketsSold: evTickets.reduce((s, t) => s + (Number(t.quantity) || 0), 0),
        };
      })
      .sort((a, b) => b.grossRevenue - a.grossRevenue);

    const withdrawalProcessingFeePercent = Number(process.env.WITHDRAWAL_PROCESSING_FEE_PERCENT || 2);
    const minWithdrawalAmount = Number(process.env.MIN_WITHDRAWAL_NGN || 1000);

    const rawAvailable = Number(user.availableBalance) || 0;
    const availableBalance = await capOrganizerAvailableBalance(userId, rawAvailable);

    res.status(200).json({
      grossTicketSales,
      platformTicketFeePercent: platformTicketFeePct,
      platformCommissionOnSales,
      netAfterSalesCommission,
      availableBalance,
      pendingBalance: Number(user.pendingBalance) || 0,
      totalWithdrawn,
      totalWithdrawalProcessingFeesCharged: totalWithdrawalProcessingFees,
      pendingWithdrawalAmount,
      withdrawalProcessingFeePercent,
      minWithdrawalAmount,
      perEvent,
    });
  } catch (err) {
    console.error("Organizer earnings error:", err);
    res.status(500).json({ message: "Failed to load earnings" });
  }
};
