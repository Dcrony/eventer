const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const mongoose = require("mongoose");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const { recordTicketPurchaseMetrics } = require("./eventController");

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

exports.createTicket = async (req, res) => {
  try {
    const { eventId, ticketType, quantity = 1, isFree } = req.body;
    const parsedQuantity = Math.max(1, Number(quantity) || 1);

    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.isFreeEvent || !(isFree === true || isFree === "true")) {
      return res.status(400).json({ message: "This endpoint only supports free events" });
    }

    if (Number(event.totalTickets || 0) < parsedQuantity) {
      return res.status(400).json({ message: "Not enough tickets available" });
    }

    const reference = `FREE-${event._id}-${req.user.id}-${Date.now()}`;
    const resolvedTicketType = String(ticketType || "Free").trim() || "Free";

    const ticket = new Ticket({
      buyer: req.user.id,
      event: event._id,
      quantity: parsedQuantity,
      ticketType: resolvedTicketType,
      price: 0,
      amount: 0,
      amountPaid: 0,
      paymentStatus: "free",
      isFree: true,
      reference,
    });

    await ticket.save();

    event.ticketsSold = Number(event.ticketsSold || 0) + parsedQuantity;
    event.totalTickets = Number(event.totalTickets || 0) - parsedQuantity;
    recordTicketPurchaseMetrics(event, parsedQuantity, 0);
    await event.save();

    const qrDir = path.join(__dirname, "../uploads/qrcodes");
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

    const frontendUrl = process.env.FRONTEND_URL || "";
    const qrData = `${frontendUrl}/validate/${ticket._id}`;
    const qrFileName = `${ticket._id}.png`;
    const qrPath = path.join(qrDir, qrFileName);
    await QRCode.toFile(qrPath, qrData);

    ticket.qrCode = `qrcodes/${qrFileName}`;
    await ticket.save();

    return res.status(201).json({
      message: "Ticket reserved successfully",
      ticket,
    });
  } catch (err) {
    console.error("Error creating free ticket:", err);
    return res.status(500).json({ message: "Server error" });
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
