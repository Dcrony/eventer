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
const { authorizeEventAction, getEventAccessForUser } = require("../utils/eventPermissions");
const { canViewEvent } = require("../utils/eventVisibility");
const {
  isConfigured,
  uploadImageBuffer,
} = require("../utils/cloudinaryMedia");
const {
  ticketPurchaseEmail,
  organizerTicketAlertEmail,
} = require("../utils/emailTemplates");

exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ buyer: req.user.id }).populate({
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

    const visibility = await canViewEvent(event, req.user, {
      allowPrivateLink: true,
    });
    if (!visibility.allowed) {
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

    // Duplicate guard — one free ticket per user per event
    const existingFreeTicket = await Ticket.findOne({
      event: event._id,
      buyer: req.user.id,
      isFree: true,
      status: { $nin: ["refunded", "cancelled"] },
    });

    if (existingFreeTicket) {
      return res.status(409).json({
        message: "You already have a free ticket for this event.",
      });
    }

    const remainingTickets = Number(event.totalTickets || 0);
    if (remainingTickets <= 0) {
      return res.status(400).json({ message: "Event is sold out" });
    }

    const freeQuantity = 1;

    if (remainingTickets < freeQuantity) {
      return res.status(400).json({ message: "Not enough tickets available" });
    }

    const reference = `FREE-${event._id}-${req.user.id}-${Date.now()}`;
    const normalizedRequestedType = String(ticketType || "").trim();
    const eventPricing = Array.isArray(event.pricing) ? event.pricing : [];
    const matchingFreeTier = normalizedRequestedType
      ? eventPricing.find((p) => p.type === normalizedRequestedType)
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
      quantity: freeQuantity,
      ticketType: resolvedTicketType,
      price: 0,
      amount: 0,
      amountPaid: 0,
      paymentStatus: "free",
      isFree: true,
      reference,
    });

    await ticket.save();

    // ✅ Snapshot capacity if not already set, then decrement only totalTickets
    if (!event.capacity || event.capacity === 0) {
      event.capacity = remainingTickets + Number(event.ticketsSold || 0);
    }
    event.ticketsSold = Number(event.ticketsSold || 0) + freeQuantity;
    event.totalTickets = Math.max(0, remainingTickets - freeQuantity);
    recordTicketPurchaseMetrics(event, freeQuantity, 0);
    await event.save();

    // Generate QR code
    const frontendUrl = process.env.FRONTEND_URL || "";
    const qrData = `${frontendUrl}/validate/${ticket._id}`;

    const qrBuffer = await QRCode.toBuffer(qrData, {
      type: "png",
      width: 400,
      margin: 2,
    });

    let qrBase64 = qrBuffer.toString("base64");

    if (isConfigured()) {
      try {
        const uploaded = await uploadImageBuffer(qrBuffer, {
          folder: "eventer/qrcodes",
        });
        ticket.qrCode = uploaded.secure_url;
        await ticket.save();
      } catch (err) {
        console.error("QR Cloudinary upload failed:", err.message);
      }
    } else {
      const qrDir = path.join(__dirname, "../uploads/qrcodes");
      if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
      const qrFileName = `${ticket._id}.png`;
      const qrPath = path.join(qrDir, qrFileName);
      fs.writeFileSync(qrPath, qrBuffer);
      ticket.qrCode = `qrcodes/${qrFileName}`;
      await ticket.save();
    }

    const buyer = await User.findById(req.user.id).select("name email");
    const organizer = await User.findById(event.createdBy).select("name email");

    if (buyer?.email) {
      try {
        await sendEmail({
          to: buyer.email,
          subject: "🎟️ Your Ticket is Confirmed",
          html: ticketPurchaseEmail(buyer.name || "Guest", event.title, freeQuantity),
          attachments: [
            {
              filename: "ticket-qr.png",
              content: qrBase64,
              encoding: "base64",
              cid: "ticketqr",
            },
          ],
        });
      } catch (err) {
        console.error("Buyer email failed:", err.message);
      }
    }

    if (organizer?.email) {
      try {
        await sendEmail({
          to: organizer.email,
          subject: "🎉 New Ticket Reserved",
          html: organizerTicketAlertEmail(
            organizer.name || "Organizer",
            event.title,
            buyer?.name || "Someone",
            freeQuantity
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

    const eventAccess = await getEventAccessForUser(ticket.event, req.user);

    if (!eventAccess.hasAccess || !eventAccess.permissions.canManageTickets) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to check in tickets for this event",
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
 * Get all tickets for an event (organizers only)
 */
exports.getEventTickets = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const lookup = await authorizeEventAction({
      eventId,
      user: req.user,
      permission: "canManageTickets",
      deniedMessage: "You do not have permission to manage tickets for this event",
    });

    if (lookup.error) {
      return res.status(lookup.error.status).json({ message: lookup.error.message });
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

    const eventAccess = await getEventAccessForUser(ticket.event, req.user);
    if (!eventAccess.hasAccess || !eventAccess.permissions.canManageTickets) {
      return res
        .status(403)
        .json({ message: "You do not have permission to refund tickets for this event" });
    }

    if (ticket.status === "refunded") {
      return res.status(400).json({ message: "Ticket already refunded" });
    }

    if (ticket.status === "checked-in") {
      return res.status(400).json({ message: "Cannot refund checked-in ticket" });
    }

    ticket.status = "refunded";
    await ticket.save();

    ticket.event.ticketsSold = Math.max(
      0,
      Number(ticket.event.ticketsSold || 0) - ticket.quantity
    );
    ticket.event.totalTickets =
      Number(ticket.event.totalTickets || 0) + ticket.quantity;
    await ticket.event.save();

    if (!ticket.isFree && ticket.amountPaid > 0) {
      const transaction = await Transaction.findOne({ ticket: ticketId });
      if (transaction) {
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
 * Resend ticket email to buyer (organizer only)
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

    const eventAccess = await getEventAccessForUser(ticket.event, req.user);
    if (!eventAccess.hasAccess || !eventAccess.permissions.canManageTickets) {
      return res
        .status(403)
        .json({ message: "You do not have permission to resend tickets for this event" });
    }

    if (!ticket.buyer?.email) {
      return res.status(400).json({ message: "Buyer email not found" });
    }

    // ── Resolve QR for email attachment ───────────────────────────────────
    let qrBase64 = null;

    if (ticket.qrCode) {
      const isCloudinaryUrl =
        typeof ticket.qrCode === "string" &&
        ticket.qrCode.startsWith("http");

      if (isCloudinaryUrl) {
        // Re-fetch from Cloudinary URL as buffer
        try {
          const https = require("https");
          const http = require("http");
          const client = ticket.qrCode.startsWith("https") ? https : http;
          qrBase64 = await new Promise((resolve, reject) => {
            client.get(ticket.qrCode, (res) => {
              const chunks = [];
              res.on("data", (chunk) => chunks.push(chunk));
              res.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
              res.on("error", reject);
            }).on("error", reject);
          });
        } catch (err) {
          console.error("Failed to fetch QR from Cloudinary for resend:", err.message);
        }
      } else {
        // Legacy local file path
        const qrPath = path.join(__dirname, "../uploads", ticket.qrCode);
        if (fs.existsSync(qrPath)) {
          qrBase64 = fs.readFileSync(qrPath).toString("base64");
        }
      }
    }

    // If QR image is unavailable for any reason, regenerate it on the fly
    if (!qrBase64) {
      try {
        const frontendUrl = process.env.FRONTEND_URL || "";
        const qrBuffer = await QRCode.toBuffer(
          `${frontendUrl}/validate/${ticket._id}`,
          { type: "png", width: 400, margin: 2 }
        );
        qrBase64 = qrBuffer.toString("base64");
      } catch (err) {
        console.error("QR regeneration failed:", err.message);
      }
    }
    // ──────────────────────────────────────────────────────────────────────

    await sendEmail({
      to: ticket.buyer.email,
      subject: "🎟️ Your Ticket - Resent",
      html: ticketPurchaseEmail(
        ticket.buyer.name || "Guest",
        ticket.event.title,
        ticket.quantity
      ),
      attachments: qrBase64
        ? [{ filename: "ticket-qr.png", content: qrBase64, encoding: "base64", cid: "ticketqr" }]
        : [],
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

    const eventAccess = await getEventAccessForUser(ticket.event, req.user);
    if (!eventAccess.hasAccess || !eventAccess.permissions.canManageTickets) {
      return res
        .status(403)
        .json({ message: "You do not have permission to check in tickets for this event" });
    }

    if (ticket.status === "checked-in") {
      return res.status(400).json({ message: "Ticket already checked in" });
    }

    if (ticket.status === "refunded") {
      return res.status(400).json({ message: "Cannot check in refunded ticket" });
    }

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