const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const User = require("../models/User");

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

      return {
        id: event._id,
        title: event.title,
        ticketsSold: eventTickets.reduce((sum, ticket) => sum + ticket.quantity, 0),
        revenue: eventTickets.reduce((sum, ticket) => sum + (ticket.amount || 0), 0),
        attendees: eventTickets.map((ticket) => ({
          buyer: ticket.buyer,
          quantity: ticket.quantity,
        })),
      };
    });

    const topEvents = [...perEventStats]
      .sort((left, right) => right.ticketsSold - left.ticketsSold)
      .slice(0, 5);

    const response = {
      totalEvents: events.length,
      totalTicketsSold,
      totalRevenue,
      currentlyLive,
      topEvents,
      perEventStats,
      availableBalance: user?.availableBalance || 0,
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

    res.status(200).json(response);
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ message: "Failed to get stats" });
  }
};
