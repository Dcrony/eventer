const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const auth = require("../middleware/authMiddleware"); // token verification

// Get tickets for logged-in user
router.get("/my-tickets", auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ buyer: req.user.id })
      .populate("event", "title date location ticketPrice image")
      .sort({ purchasedAt: -1 });

    res.json(tickets);
  } catch (err) {
    console.error("MY TICKETS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Example function to generate QR after ticket purchase
router.post("/generate-qr/:ticketId", auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const qrData = `TICKET:${ticket._id}:${ticket.buyer}`;
    const qrImage = await QRCode.toDataURL(qrData);

    ticket.qrCode = qrImage;
    await ticket.save();

    res.json({ qrCode: qrImage });
  } catch (err) {
    console.error("QR ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
