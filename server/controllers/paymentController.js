require("dotenv").config();
const axios = require("axios");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const sendEmail = require("../utils/email");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;
const successURL = `${process.env.FRONTEND_URL}/success`;
const failedURL = `${process.env.FRONTEND_URL}/failed`;

console.log("PAYSTACK KEY:", PAYSTACK_SECRET);

//Initiate Payment
exports.initiatePayment = async (req, res) => {
  const { email, amount } = req.body;

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100,
        callback_url: process.env.PAYSTACK_CALLBACK,
        metadata: {
          eventId: req.body.metadata.eventId,
          userId: req.user.id,
          quantity: req.body.metadata.quantity,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({ url: response.data.data.authorization_url });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Payment initialization failed" });
  }
};

// Verify Payment

exports.verifyPayment = async (req, res) => {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ message: "Missing payment reference" });
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    const data = response.data.data;

    // Safely destructure metadata
    const { eventId, userId, quantity } = data.metadata || {};

    if (data.status === "success") {
      // Check if ticket already exists
      const existingTicket = await Ticket.findOne({
        reference: data.reference,
      });
      if (existingTicket) return res.redirect(successURL);

      // Get event
      const event = await Event.findById(eventId);
      const user = await User.findById(userId); // ✅ fetch user
      if (!event || event.totalTickets < quantity) {
        return res
          .status(400)
          .json({ message: "Invalid event or not enough tickets" });
      }

      // Create ticket
      const ticket = new Ticket({
        event: eventId,
        buyer: userId,
        quantity,
        amount: data.amount / 100, // ✅ convert from kobo to Naira
        reference: data.reference,
      });

      // Update ticketsSold in Event
      await Event.findByIdAndUpdate(eventId, {
        $inc: { ticketsSold: quantity }, // increment
      });

      // Ensure QR folder exists
      const qrDir = path.join(__dirname, "../uploads/qrcodes");
      if (!fs.existsSync(qrDir)) {
        fs.mkdirSync(qrDir, { recursive: true });
      }

      // Generate QR code
      const qrData = `${FRONTEND_URL}/tickets/validate/${ticket._id}`;
      const qrFileName = `${ticket._id}.png`;
      const qrFilePath = path.join(qrDir, qrFileName);

      await QRCode.toFile(qrFilePath, qrData);

      // Save filename to DB
      ticket.qrCode = `qrcodes/${qrFileName}`;
      await ticket.save();

      // Reduce available tickets
      event.totalTickets -= quantity;
      await event.save();

      // Send confirmation email with QR
      await sendEmail(
        user.email,
        "🎟️ Your Ticket Confirmation",
        `<h2>Thanks for your purchase, ${user.name}!</h2>
   <p>Your ticket is confirmed for <b>${event.title}</b></p>
   <p>Show this QR code at entrance:</p>
   <img src="${FRONTEND_URL}/uploads/${ticket.qrCode}" alt="QR Code" />`
      );

      return res.redirect(successURL);
    } else {
      return res.redirect(failedURL);
    }
  } catch (error) {
    console.error(
      "Payment verification error:",
      error.response?.data || error.message
    );
    return res.status(500).send("Verification failed");
  }
};
