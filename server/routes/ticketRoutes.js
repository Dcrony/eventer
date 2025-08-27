// routes/ticketRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Ticket = require("../models/Ticket");
const {authMiddleware} = require("../middleware/authMiddleware");
const { getMyTickets } = require("../controllers/ticketController");



// GET /api/tickets/my-tickets
router.get("/my-tickets", authMiddleware, getMyTickets);
// GET /api/tickets/validate/:payload

router.get("/validate/:ticketId", async (req, res) => {
  try {
    const raw = req.params.ticketId || "";
    // Extract first 24-hex sequence (ObjectId) from whatever came in
    const match = raw.match(/[0-9a-fA-F]{24}/);
    const ticketId = match ? match[0] : null;

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ success: false, message: "Invalid QR data" });
    }

    const ticket = await Ticket.findById(ticketId)
      .populate("event", "title date location");

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // Optional: if you added these fields to the schema
    if (ticket.used) {
      return res.json({ success: false, message: "Ticket already used", event: ticket.event });
    }

    // Mark used
    ticket.used = true;
    ticket.usedAt = new Date();
    await ticket.save();

    return res.json({
      success: true,
      message: "Ticket valid",
      event: ticket.event,
      ticket: { id: ticket._id, quantity: ticket.quantity }
    });
  } catch (err) {
    console.error("VALIDATE ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



module.exports = router;
