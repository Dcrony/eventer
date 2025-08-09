const Event = require("../models/Event");
const Ticket = require("../models/Ticket");

exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const events = await Event.find({ createdBy: userId });
    const eventIds = events.map((e) => e._id);

    const tickets = await Ticket.find({ event: { $in: eventIds } });

    const totalTicketsSold = tickets.reduce((acc, ticket) => acc + ticket.quantity, 0);
    const totalRevenue = tickets.reduce((acc, ticket) => {
      const event = events.find((e) => e._id.toString() === ticket.event.toString());
      return acc + (event?.ticketPrice || 0) * ticket.quantity;
    }, 0);

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
