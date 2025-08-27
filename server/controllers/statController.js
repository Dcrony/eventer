const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const User = require("../models/User"); // <-- import User

exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Organizer’s events
    const events = await Event.find({ createdBy: userId });
    const eventIds = events.map((e) => e._id);

    const tickets = await Ticket.find({ event: { $in: eventIds } })
      .populate("buyer", "username email");

    const totalTicketsSold = tickets.reduce(
      (acc, ticket) => acc + ticket.quantity,
      0
    );

    const totalRevenue = tickets.reduce((acc, ticket) => {
      const event = events.find(
        (e) => e._id.toString() === ticket.event.toString()
      );
      return acc + (event?.ticketPrice || 0) * ticket.quantity;
    }, 0);

    const currentlyLive = events.filter((e) => e.liveStream?.isLive).length;

    // Event-specific stats
    const perEventStats = events.map((event) => {
      const eventTickets = tickets.filter(
        (t) => t.event.toString() === event._id.toString()
      );
      const ticketsSold = eventTickets.reduce(
        (acc, t) => acc + t.quantity,
        0
      );
      const revenue = ticketsSold * (event.ticketPrice || 0);

      return {
        id: event._id,
        title: event.title,
        ticketsSold,
        revenue,
        attendees: eventTickets.map((t) => ({
          buyer: t.buyer,
          quantity: t.quantity,
        })),
      };
    });

    // Top events
    const topEvents = [...perEventStats]
      .sort((a, b) => b.ticketsSold - a.ticketsSold)
      .slice(0, 5);

    // Base response (organizer stats)
    const response = {
      totalEvents: events.length,
      totalTicketsSold,
      totalRevenue,
      currentlyLive,
      topEvents,
      perEventStats,
    };

    // 🔑 If user is ADMIN, add user stats
    if (userRole === "admin") {
      const totalUsers = await User.countDocuments();
      const organizers = await User.countDocuments({ role: "organizer" });

      // Example: "active users" = updated within last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeUsers = await User.countDocuments({
        updatedAt: { $gte: thirtyDaysAgo },
      });

      response.totalUsers = totalUsers;
      response.organizers = organizers;
      response.activeUsers = activeUsers;
    }

    res.status(200).json(response);
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ message: "Failed to get stats" });
  }
};
