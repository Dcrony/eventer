require("dotenv").config();
const axios = require("axios");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const sendEmail = require("../utils/email");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;
const successURL = `${FRONTEND_URL}/success`;
const failedURL = `${FRONTEND_URL}/failed`;

// ✅ Use fallback for callback_url
const PAYSTACK_CALLBACK =
  process.env.PAYSTACK_CALLBACK ||
  `${process.env.BACKEND_URL}/api/payment/verify`;

// 🟢 INITIATE PAYMENT
exports.initiatePayment = async (req, res) => {
  const { email, amount, metadata } = req.body;

  console.log("📤 Payment initiation request received:", {
    email,
    amount,
    metadata
  });

  try {
    // Convert metadata values to strings for Paystack compatibility
    const processedMetadata = {};
    if (metadata) {
      Object.keys(metadata).forEach(key => {
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
        amount: amount * 100,
        callback_url: PAYSTACK_CALLBACK,
        metadata: processedMetadata,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Paystack initialization response:", response.data);

    return res.status(200).json({ url: response.data.data.authorization_url });
  } catch (err) {
    console.error(
      "❌ Payment initialization failed:",
      err.response?.data || err.message
    );
    return res.status(500).json({ message: "Payment initialization failed" });
  }
};

// 🟢 VERIFY PAYMENT
exports.verifyPayment = async (req, res) => {
  const { reference, trxref } = req.query;

  console.log("🔍 Payment verification called with:", { reference, trxref });

  if (!reference) {
    console.error("❌ No reference provided");
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
    
    if (!data) {
      console.error("❌ No data in Paystack response");
      return res.status(400).json({ message: "No transaction data found" });
    }

    console.log("✅ Paystack verification response received");
    console.log("💰 Transaction status:", data.status);
    console.log("🏷️ Transaction reference:", data.reference);
    console.log("📝 Full metadata from Paystack:", JSON.stringify(data.metadata, null, 2));

    // Extract metadata with fallbacks
    let eventId = data.metadata?.eventId;
    let userId = data.metadata?.userId;
    let quantity = data.metadata?.quantity;
    let price = data.metadata?.price;
    let pricingType = data.metadata?.pricingType;

    console.log("📊 Extracted metadata:", {
      eventId,
      userId,
      quantity,
      price,
      pricingType
    });

    // Convert quantity to number
    if (quantity) {
      quantity = parseInt(quantity, 10);
    }

    // Convert price to number
    if (price) {
      price = parseFloat(price);
    }

    // Handle missing userId - try to find by email
    let finalUserId = userId;
    if (!finalUserId && data.customer && data.customer.email) {
      console.log("🔍 userId missing, trying to find user by email:", data.customer.email);
      const userByEmail = await User.findOne({ email: data.customer.email });
      if (userByEmail) {
        finalUserId = userByEmail._id.toString(); // Convert to string
        console.log("✅ Found user by email:", finalUserId);
      }
    }

    // If userId is an email, find the user
    if (finalUserId && typeof finalUserId === 'string' && finalUserId.includes('@')) {
      console.log("📧 userId looks like an email, finding user...");
      const userByEmail = await User.findOne({ email: finalUserId });
      if (userByEmail) {
        finalUserId = userByEmail._id.toString(); // Convert to string
        console.log("✅ Converted email to user _id:", finalUserId);
      }
    }

    console.log("🎯 Final values before validation:", {
      eventId,
      userId: finalUserId,
      quantity,
      price,
      pricingType
    });

    if (!eventId || !finalUserId || !quantity) {
      console.error("❌ Incomplete metadata after all attempts");
      return res.status(400).json({ 
        message: "Incomplete metadata",
        details: { 
          eventId, 
          userId: finalUserId, 
          quantity,
          hasMetadata: !!data.metadata
        },
        metadata: data.metadata
      });
    }

    if (data.status === "success") {
      // Avoid duplicate tickets
      const existingTicket = await Ticket.findOne({ reference: data.reference });
      if (existingTicket) {
        console.log("⚠️ Ticket already exists for this reference");
        return res.redirect(successURL);
      }

      // Fetch event and user - convert finalUserId back to ObjectId for query
      const event = await Event.findById(eventId);
      const user = await User.findById(finalUserId);

      if (!event || !user) {
        console.error("❌ Invalid event or user:", { eventId, userId: finalUserId });
        return res.status(400).json({ message: "Invalid event or user" });
      }

      if (event.totalTickets < quantity) {
        console.error("❌ Not enough tickets:", { 
          available: event.totalTickets, 
          requested: quantity 
        });
        return res.status(400).json({ message: "Not enough tickets available" });
      }

      // Determine ticket price
      let ticketPrice = price;
      
      if (!ticketPrice && event.pricing && event.pricing.length > 0) {
        if (pricingType) {
          // Find the specific pricing type
          const selectedPricing = event.pricing.find(p => p.type === pricingType);
          if (selectedPricing) {
            ticketPrice = selectedPricing.price;
            console.log(`💰 Found ${pricingType} price:`, ticketPrice);
          }
        }
        
        // If still no price, use first pricing option
        if (!ticketPrice) {
          ticketPrice = event.pricing[0].price || 0;
          console.log("💰 Using first pricing option:", ticketPrice);
        }
      }

      // Ensure we have a price
      if (!ticketPrice || ticketPrice === 0) {
        // Calculate from total amount
        if (quantity > 0) {
          ticketPrice = (data.amount / 100) / quantity;
          console.log("💰 Calculated price from total amount:", ticketPrice);
        } else {
          ticketPrice = 0;
          console.log("⚠️ Could not determine ticket price");
        }
      }

      console.log("🎫 Final ticket details:", {
        pricePerTicket: ticketPrice,
        quantity,
        totalAmount: data.amount / 100
      });

      // Create new ticket
      const ticket = new Ticket({
        event: eventId,
        buyer: finalUserId, // This should be ObjectId or string that mongoose can convert
        quantity,
        price: ticketPrice,
        amount: data.amount / 100,
        reference: data.reference,
        pricingType: pricingType,
      });

      // Update event tickets
      await Event.findByIdAndUpdate(eventId, {
        $inc: { ticketsSold: quantity },
      });

      // Generate and store QR code
      const qrDir = path.join(__dirname, "../uploads/qrcodes");
      if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

      const qrData = `${FRONTEND_URL}/tickets/validate/${ticket._id}`;
      const qrFileName = `${ticket._id}.png`;
      const qrFilePath = path.join(qrDir, qrFileName);
      await QRCode.toFile(qrFilePath, qrData);

      ticket.qrCode = `qrcodes/${qrFileName}`;
      await ticket.save();

      // Decrease available tickets
      event.totalTickets -= quantity;
      await event.save();

      // Send confirmation email
      await sendEmail(
        user.email,
        "🎟️ Ticket Confirmation",
        `<h2>Hi ${user.name || user.username},</h2>
         <p>Your ticket for <b>${event.title}</b> has been confirmed!</p>
         <p><strong>Ticket Type:</strong> ${pricingType || "Standard"}</p>
         <p><strong>Quantity:</strong> ${quantity}</p>
         <p><strong>Price per ticket:</strong> ₦${ticketPrice.toLocaleString()}</p>
         <p><strong>Total paid:</strong> ₦${(data.amount / 100).toLocaleString()}</p>
         <p>Show this QR code at the entrance:</p>
         <img src="${FRONTEND_URL}/uploads/${ticket.qrCode}" alt="QR Code" />
         <p><small>Reference: ${data.reference}</small></p>`
      );

      console.log("✅ Ticket created successfully, redirecting to success page");
      return res.redirect(successURL);
    }

    console.log("❌ Payment failed or pending, redirecting to failed page");
    return res.redirect(failedURL);
  } catch (error) {
    console.error(
      "❌ Payment verification error:",
      error.message,
      error.stack
    );
    if (error.response) {
      console.error("📡 Error response data:", error.response.data);
      console.error("📡 Error response status:", error.response.status);
    }
    return res.status(500).json({ 
      message: "Verification failed",
      error: error.message 
    });
  }
};