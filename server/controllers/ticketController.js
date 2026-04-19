const Ticket = require("../models/Ticket");
const mongoose = require("mongoose");

exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ buyer: req.user.id })
      .populate({
        path: "event",
        populate: {
          path: "createdBy",
          select: "username profilePic",
        },
      });

    if (!tickets || tickets.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(tickets);
  } catch (err) {
    console.error("Error fetching user tickets:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Check-in: mark ticket used. Only admin or the event organizer may validate.
 */
exports.validateTicket = async (req, res) => {
  try {
    const raw = req.params.ticketId || "";
    const match = raw.match(/[0-9a-fA-F]{24}/);
    const ticketId = match ? match[0] : null;

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ success: false, message: "Invalid QR data" });
    }

    const ticket = await Ticket.findById(ticketId).populate({
      path: "event",
      select: "title startDate location createdBy",
    });

    if (!ticket || !ticket.event) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const event = ticket.event;
    const userId = req.user.id.toString();
    const isAdmin = req.user.role === "admin";
    const isEventOwner =
      event.createdBy && event.createdBy.toString() === userId;

    if (!isAdmin && !isEventOwner) {
      return res.status(403).json({
        success: false,
        message: "You can only check in tickets for your own events",
      });
    }

    if (ticket.used) {
      return res.json({
        success: false,
        message: "Ticket already used",
        event: ticket.event,
      });
    }

    ticket.used = true;
    ticket.usedAt = new Date();
    await ticket.save();

    return res.json({
      success: true,
      message: "Ticket valid",
      event: ticket.event,
      ticket: { id: ticket._id, quantity: ticket.quantity },
    });
  } catch (err) {
    console.error("VALIDATE ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
