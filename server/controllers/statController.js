const Event = require("../models/Event");
const Ticket = require("../models/Ticket");

exports.getStats = async (req, res) => {
  try {
    console.log("Stats for user:", req.user); // Check what's in req.user
    const userId = req.user.id;

    const events = await Event.find({ createdBy: userId });
    const eventIds = events.map((e) => e._id);

    const tickets = await Ticket.find({ event: { $in: eventIds } });

    const totalTicketsSold = tickets.reduce(
      (acc, ticket) => acc + ticket.quantity,
      0
    );
    const totalRevenue = tickets.reduce((acc, ticket) => {
      const event = events.find((e) => e._id.equals(ticket.event));
      if (!event) return acc; // skip if event not found
      return acc + event.ticketPrice * ticket.quantity;
    }, 0);
console.log("Events:", events);
console.log("Tickets:", tickets);

    const currentlyLive = events.filter((e) => e.liveStream?.isLive).length;

    res.json({
      totalEvents: events.length,
      totalTicketsSold,
      totalRevenue,
      currentlyLive,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
