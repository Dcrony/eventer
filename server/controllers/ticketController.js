const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const { recordTicketPurchaseMetrics } = require("./eventController");
const User = require("../models/User");
const sendEmail = require("../utils/email");
const {
  ticketPurchaseEmail,
  organizerTicketAlertEmail,
} = require("../utils/emailTemplates");



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

    const requestedFreeTicket = isFree === true || isFree === "true";
    const eventIsFree = event.isFree === true || event.isFreeEvent === true;
    if (!eventIsFree) {
      if (requestedFreeTicket) {
        return res.status(400).json({ message: "Paid events require payment before ticket creation" });
      }

      return res.status(400).json({ message: "This endpoint only supports free events" });
    }

    if (!requestedFreeTicket) {
      return res.status(400).json({ message: "Free ticket request must be marked as free" });
    }

    const remainingTickets = Number(event.totalTickets || 0);
    if (remainingTickets <= 0) {
      return res.status(400).json({ message: "Event is sold out" });
    }

    if (remainingTickets < parsedQuantity) {
      return res.status(400).json({ message: "Not enough tickets available" });
    }

    const reference = `FREE-${event._id}-${req.user.id}-${Date.now()}`;
    const normalizedRequestedType = String(ticketType || "").trim();
    const eventPricing = Array.isArray(event.pricing) ? event.pricing : [];
    const matchingFreeTier = normalizedRequestedType
      ? eventPricing.find((pricing) => pricing.type === normalizedRequestedType)
      : null;
    if (normalizedRequestedType && eventPricing.length > 0 && !matchingFreeTier) {
      return res.status(400).json({ message: "Invalid ticket type for this event" });
    }

    const resolvedTicketType =
      matchingFreeTier?.type ||
      normalizedRequestedType ||
      eventPricing[0]?.type ||
      "Free";

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
    event.totalTickets = Math.max(0, remainingTickets - parsedQuantity);
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

    const fileToBase64 = (filePath) => {
      const file = fs.readFileSync(filePath);
      return file.toString("base64");
    };

    const qrBase64 = fileToBase64(qrPath);

    // 🟢 GET USERS
    const buyer = await User.findById(req.user.id).select("name email");
    const organizer = await User.findById(event.createdBy).select("name email");

    // 🟢 SEND EMAIL TO BUYER
    if (buyer?.email) {
      try {
        await sendEmail({
          to: buyer.email,
          subject: "🎟️ Your Ticket is Confirmed",
          html: ticketPurchaseEmail(
            buyer.name || "Guest",
            event.title,
            parsedQuantity
          ),
          attachments: [
            {
              filename: "ticket-qr.png",
              content: qrBase64,
              cid: "ticketqr", // matches HTML
            },
          ],
        });
      } catch (err) {
        console.error("Buyer email failed:", err.message);
      }
    }

    // 🟢 SEND EMAIL TO ORGANIZER
    if (organizer?.email) {
      try {
        await sendEmail({
          to: organizer.email,
          subject: "🎉 New Ticket Reserved",
          html: organizerTicketAlertEmail(
            organizer.name || "Organizer",
            event.title,
            buyer?.name || "Someone",
            parsedQuantity
          ),
        });
      } catch (err) {
        console.error("Organizer email failed:", err.message);
      }
    }

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

    if (ticket.status === "checked-in" || ticket.used) {
      return res.json({
        success: false,
        message: "Ticket already used",
        event: ticket.event,
      });
    }

    ticket.used = true;
    ticket.status = "checked-in";
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

/**
 * Get all tickets for an event (for organizers)
 */
exports.getEventTickets = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    // Check if user is the event owner
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const isOwner = String(event.createdBy) === String(req.user.id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const tickets = await Ticket.find({ event: eventId })
      .populate("buyer", "name email username profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (err) {
    console.error("Error fetching event tickets:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Refund a ticket (organizer only)
 */
exports.refundTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    const ticket = await Ticket.findById(ticketId).populate("event");
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check if user is the event owner
    const isOwner = String(ticket.event.createdBy) === String(req.user.id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (ticket.status === "refunded") {
      return res.status(400).json({ message: "Ticket already refunded" });
    }

    if (ticket.status === "checked-in") {
      return res.status(400).json({ message: "Cannot refund checked-in ticket" });
    }

    // Update ticket status
    ticket.status = "refunded";
    await ticket.save();

    // Update event metrics (reverse the purchase)
    ticket.event.ticketsSold = Math.max(0, Number(ticket.event.ticketsSold || 0) - ticket.quantity);
    ticket.event.totalTickets = Number(ticket.event.totalTickets || 0) + ticket.quantity;
    await ticket.event.save();

    // If paid ticket, handle refund via payment processor
    if (!ticket.isFree && ticket.amountPaid > 0) {
      // Find the transaction
      const transaction = await Transaction.findOne({ ticket: ticketId });
      if (transaction) {
        // Process refund through payment provider (Paystack/Stripe)
        // This would need integration with the payment service
        // For now, mark as refunded
        transaction.status = "refunded";
        await transaction.save();
      }
    }

    res.status(200).json({ message: "Ticket refunded successfully", ticket });
  } catch (err) {
    console.error("Error refunding ticket:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Resend ticket email to buyer
 */
exports.resendTicketEmail = async (req, res) => {
  try {
    const { ticketId } = req.params;

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    const ticket = await Ticket.findById(ticketId)
      .populate("event")
      .populate("buyer", "name email");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check if user is the event owner
    const isOwner = String(ticket.event.createdBy) === String(req.user.id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!ticket.buyer?.email) {
      return res.status(400).json({ message: "Buyer email not found" });
    }

    // Generate QR code if not exists
    let qrBase64 = null;
    if (ticket.qrCode) {
      const qrPath = path.join(__dirname, "../uploads", ticket.qrCode);
      if (fs.existsSync(qrPath)) {
        qrBase64 = fs.readFileSync(qrPath).toString("base64");
      }
    }

    // Send email
    await sendEmail({
      to: ticket.buyer.email,
      subject: "🎟️ Your Ticket - Resent",
      html: ticketPurchaseEmail(
        ticket.buyer.name || "Guest",
        ticket.event.title,
        ticket.quantity
      ),
      attachments: qrBase64 ? [
        {
          filename: "ticket-qr.png",
          content: qrBase64,
          cid: "ticketqr",
        },
      ] : [],
    });

    res.status(200).json({ message: "Ticket email resent successfully" });
  } catch (err) {
    console.error("Error resending ticket email:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Manual check-in ticket (organizer only)
 */
exports.manualCheckIn = async (req, res) => {
  try {
    const { ticketId } = req.params;

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    const ticket = await Ticket.findById(ticketId).populate({
      path: "event",
      select: "title startDate location createdBy",
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check if user is the event owner
    const isOwner = String(ticket.event.createdBy) === String(req.user.id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (ticket.status === "checked-in") {
      return res.status(400).json({ message: "Ticket already checked in" });
    }

    if (ticket.status === "refunded") {
      return res.status(400).json({ message: "Cannot check in refunded ticket" });
    }

    // Update ticket status
    ticket.status = "checked-in";
    ticket.used = true;
    ticket.usedAt = new Date();
    await ticket.save();

    res.status(200).json({
      message: "Ticket checked in successfully",
      ticket: {
        id: ticket._id,
        quantity: ticket.quantity,
        status: ticket.status,
        usedAt: ticket.usedAt,
      },
    });
  } catch (err) {
    console.error("Error checking in ticket:", err);
    res.status(500).json({ message: "Server error" });
  }
};
