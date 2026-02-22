require("dotenv").config();
const axios = require("axios");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const sendEmail = require("../utils/email");
const Transaction = require("../models/Transaction");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;
const successURL = `${FRONTEND_URL}/success`;
const failedURL = `${FRONTEND_URL}/failed`;

// Use fallback for callback_url
const PAYSTACK_CALLBACK =
  process.env.PAYSTACK_CALLBACK ||
  `${process.env.BACKEND_URL}/api/payment/verify`;

// 🟢 INITIATE PAYMENT
exports.initiatePayment = async (req, res) => {
  const { email, amount, metadata } = req.body;

  console.log("📤 Payment initiation request received:", {
    email,
    amount,
    metadata,
  });

  try {
    // Convert metadata values to strings (Paystack requirement)
    const processedMetadata = {};
    if (metadata) {
      Object.keys(metadata).forEach((key) => {
        if (metadata[key] !== undefined && metadata[key] !== null) {
          processedMetadata[key] = metadata[key].toString();
        }
      });
    }

    console.log("📦 Processed metadata for Paystack:", processedMetadata);

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // in kobo
        callback_url: PAYSTACK_CALLBACK,
        metadata: processedMetadata,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✅ Paystack initialization response:", response.data);

    return res.status(200).json({ url: response.data.data.authorization_url });
  } catch (err) {
    console.error(
      "❌ Payment initialization failed:",
      err.response?.data || err.message,
    );
    return res.status(500).json({ message: "Payment initialization failed" });
  }
};

// 🟢 VERIFY PAYMENT
exports.verifyPayment = async (req, res) => {
  const { reference } = req.query;

  console.log("🔍 Payment verification called with reference:", reference);

  if (!reference) {
    console.error("❌ No reference provided");
    return res.status(400).json({ message: "Missing payment reference" });
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      },
    );

    const data = response.data.data;

    if (!data) {
      console.error("❌ No data in Paystack response");
      return res.status(400).json({ message: "No transaction data found" });
    }

    console.log("💰 Transaction status:", data.status);
    console.log("📝 Metadata:", data.metadata);

    let { eventId, userId, quantity, price, pricingType } = data.metadata;

    // Convert quantity and price
    quantity = parseInt(quantity, 10);
    price = parseFloat(price);

    // Handle missing userId by email
    let finalUserId = userId;
    if (!finalUserId && data.customer?.email) {
      const userByEmail = await User.findOne({ email: data.customer.email });
      if (userByEmail) finalUserId = userByEmail._id.toString();
    }

    // If userId is an email, convert to ObjectId
    if (finalUserId?.includes("@")) {
      const userByEmail = await User.findOne({ email: finalUserId });
      if (userByEmail) finalUserId = userByEmail._id.toString();
    }

    if (!eventId || !finalUserId || !quantity) {
      console.error("❌ Incomplete metadata");
      return res.status(400).json({
        message: "Incomplete metadata",
        metadata: data.metadata,
      });
    }

    if (data.status === "success") {
      // Prevent duplicate tickets
      const existingTicket = await Ticket.findOne({ reference });
      if (existingTicket) return res.redirect(successURL);

      // Fetch event and user
      const event = await Event.findById(eventId);
      const user = await User.findById(finalUserId);

      if (!event || !user)
        return res.status(400).json({ message: "Invalid event or user" });

      if (event.totalTickets < quantity)
        return res
          .status(400)
          .json({ message: "Not enough tickets available" });

      // Determine final ticket price
      let ticketPrice = price;
      if (!ticketPrice && event.pricing?.length > 0) {
        const selectedPricing = event.pricing.find(
          (p) => p.type === pricingType,
        );
        ticketPrice = selectedPricing?.price || event.pricing[0].price || 0;
      }

      if (!ticketPrice || ticketPrice === 0)
        ticketPrice = data.amount / 100 / quantity;

      // Create ticket
      const ticket = new Ticket({
        event: eventId,
        buyer: finalUserId,
        quantity,
        price: ticketPrice,
        amount: ticketPrice * quantity,
        reference,
        ticketType: pricingType,
      });

      await ticket.save();

      // Update event tickets
      event.ticketsSold += quantity;
      event.totalTickets -= quantity;

      // After ticket save success
      await Transaction.create({
        organizer: event.organizer, // make sure event has organizer field
        type: "ticket",
        amount: data.amount / 100,
        status: "success",
        reference: data.reference,
        metadata: {
          eventId: event._id,
          ticketId: ticket._id,
        },
      });

      await event.save();

      // Generate QR code
      const qrDir = path.join(__dirname, "../uploads/qrcodes");
      if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

      const qrData = `${FRONTEND_URL}/tickets/validate/${ticket._id}`;
      const qrFileName = `${ticket._id}.png`;
      await QRCode.toFile(path.join(qrDir, qrFileName), qrData);
      ticket.qrCode = `qrcodes/${qrFileName}`;
      await ticket.save();

      // Send confirmation email
      await sendEmail(
        user.email,
        "🎟️ Ticket Confirmation",
        `<h2>Hi ${user.name || user.username},</h2>
         <p>Your ticket for <b>${event.title}</b> has been confirmed!</p>
         <p><strong>Ticket Type:</strong> ${pricingType || "Standard"}</p>
         <p><strong>Quantity:</strong> ${quantity}</p>
         <p><strong>Price per ticket:</strong> ₦${ticketPrice.toLocaleString()}</p>
         <p><strong>Total paid:</strong> ₦${(ticketPrice * quantity).toLocaleString()}</p>
         <p>Show this QR code at the entrance:</p>
         <img src="${FRONTEND_URL}/uploads/${ticket.qrCode}" alt="QR Code" />
         <p><small>Reference: ${reference}</small></p>`,
      );

      console.log(
        "✅ Ticket created successfully, redirecting to success page",
      );
      return res.redirect(successURL);
    }

    console.log("❌ Payment failed or pending, redirecting to failed page");
    return res.redirect(failedURL);
  } catch (error) {
    console.error("❌ Payment verification error:", error.message, error.stack);
    if (error.response)
      console.error("📡 Paystack error:", error.response.data);
    return res
      .status(500)
      .json({ message: "Verification failed", error: error.message });
  }
};
