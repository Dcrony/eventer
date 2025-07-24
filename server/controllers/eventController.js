const Ticket = require("../models/Ticket");
const Event = require("../models/Event");

exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      date,
      time,
      location,
      image,
      ticketPrice,
      totalTickets,
      streamType,
      streamURL,
    } = req.body;

    const newEvent = new Event({
      title,
      description,
      category,
      date,
      time,
      location,
      image,
      createdBy: req.user.id, // from auth middleware
      ticketPrice,
      totalTickets,
      liveStream: {
        isLive: false,
        streamType,
        streamURL,
      },
    });

    await newEvent.save();
    res
      .status(201)
      .json({ message: "Event created successfully", event: newEvent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user.id }).populate(
      "createdBy",
      "username email"
    );
    res.status(200).json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET all events
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("createdBy", "username email");
    res.status(200).json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getEventBuyers = async (req, res) => {
  const { eventId } = req.params;

  try {
    const tickets = await Ticket.find({ event: eventId })
      .populate("user", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.purchaseTicket = async (req, res) => {
  try {
    const { eventId, quantity } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.totalTickets < quantity) {
      return res.status(400).json({ message: "Not enough tickets available" });
    }

    // Create ticket
    const ticket = new Ticket({
      event: event._id,
      user: req.user.id,
      quantity,
    });

    await ticket.save();

    // Reduce ticket count
    event.totalTickets -= quantity;
    await event.save();

    res.status(201).json({ message: "Ticket purchased!", ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.toggleLiveStream = async (req, res) => {
  const { eventId, isLive } = req.body;

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    event.liveStream.isLive = isLive;
    await event.save();

    res
      .status(200)
      .json({ message: `Stream is now ${isLive ? "LIVE" : "OFF"}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Event Update
exports.updateEvent = async (req, res) => {
  const { eventId } = req.params;
  const updates = req.body;

  try {
    const event = await Event.findById(eventId);

    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    Object.assign(event, updates);
    await event.save();

    res.status(200).json({ message: "Event updated", event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


//Delete Event
exports.deleteEvent = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    await Event.findByIdAndDelete(eventId);
    res.status(200).json({ message: "Event deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const events = await Event.find({ createdBy: userId });
    const eventIds = events.map((e) => e._id);

    const tickets = await Ticket.find({ event: { $in: eventIds } });

    const totalTicketsSold = tickets.reduce((acc, ticket) => acc + ticket.quantity, 0);

    const totalRevenue = tickets.reduce((acc, ticket) => {
      const event = events.find((e) => e._id.equals(ticket.event));
      return acc + (event?.ticketPrice || 0) * ticket.quantity;
    }, 0);

    const eventSales = {};
    tickets.forEach((ticket) => {
      const id = ticket.event.toString();
      eventSales[id] = (eventSales[id] || 0) + ticket.quantity;
    });

    const topEvents = Object.entries(eventSales)
      .map(([id, quantitySold]) => {
        const event = events.find((e) => e._id.toString() === id);
        return {
          title: event?.title || "Unknown",
          quantitySold,
        };
      })
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    res.status(200).json({
      totalEvents: events.length,
      totalTickets: totalTicketsSold,
      totalRevenue,
      topEvents,
    });
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ message: "Failed to get stats" });
  }
};
