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
const Notification = require("../models/Notification");

const PAYSTACK_SECRET =
  process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;
const successURL = `${FRONTEND_URL}/success`;
const failedURL = `${FRONTEND_URL}/failed`;

// Use fallback for callback_url
const PAYSTACK_CALLBACK =
  process.env.PAYSTACK_CALLBACK ||
  `${process.env.BACKEND_URL}/api/payment/verify`;

// 🟢 INITIATE PAYMENT
exports.initiatePayment = async (req, res) => {
  if (!PAYSTACK_SECRET) {
    return res.status(500).json({ message: "Payment provider not configured" });
  }

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

    let paystackEmail = email;
    if (req.user) {
      processedMetadata.userId = req.user.id.toString();
      paystackEmail = req.user.email || email;
    }

    console.log("📦 Processed metadata for Paystack:", processedMetadata);

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: paystackEmail,
        amount: amount * 100, // in kobo
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
      }
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
          (p) => p.type === pricingType
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

      if (!event) {
        console.error("❌ Event not found");
        return res.status(404).json({ message: "Event not found" });
      }

      if (!event.createdBy) {
        console.error("❌ Event has no organizer");
        return res.status(400).json({ message: "Event has no organizer" });
      }

      const organizer = await User.findById(event.createdBy);

      if (!organizer) {
        console.error("❌ Organizer not found in database");
        return res.status(404).json({ message: "Organizer not found" });
      }

      organizer.availableBalance += data.amount / 100;
      await organizer.save();

      // Update event tickets
      event.ticketsSold += quantity;
      event.totalTickets -= quantity;
      await event.save();

      // Create transaction record
      await Transaction.create({
        organizer: event.createdBy,
        type: "ticket",
        amount: data.amount / 100,
        status: "success",
        reference: data.reference,
        metadata: {
          eventId: event._id,
          ticketId: ticket._id,
        },
      });

      // Generate QR code
      const qrDir = path.join(__dirname, "../uploads/qrcodes");
      if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

      const qrData = `${FRONTEND_URL}/validate/${ticket._id}`;
      const qrFileName = `${ticket._id}.png`;
      const qrPath = path.join(qrDir, qrFileName);
      await QRCode.toFile(qrPath, qrData);
      
      // Read QR code as buffer for email attachment
      const qrBuffer = fs.readFileSync(qrPath);
      
      ticket.qrCode = `qrcodes/${qrFileName}`;
      await ticket.save();

      // ===== SEND EMAIL TO BUYER =====
      try {
        const buyerEmailResult = await sendEmail({
          to: user.email,
          subject: "🎟️ Ticket Confirmation - TickiSpot",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: 'Inter', sans-serif; background: #f9fafb; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
                .header { background: linear-gradient(135deg, #ec4899, #f43f5e); padding: 30px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 28px; }
                .content { padding: 40px 30px; }
                .event-details { background: #f8fafc; border-radius: 16px; padding: 20px; margin: 20px 0; }
                .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
                .detail-row:last-child { border-bottom: none; }
                .label { color: #64748b; font-weight: 500; }
                .value { color: #0f172a; font-weight: 600; }
                .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: white; border-radius: 16px; border: 2px dashed #ec4899; }
                .qr-code { width: 200px; height: 200px; margin: 0 auto; }
                .footer { text-align: center; padding: 30px; background: #f1f5f9; color: #64748b; }
                .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #ec4899, #f43f5e); color: white; text-decoration: none; border-radius: 30px; font-weight: 600; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Payment Successful!</h1>
                </div>
                <div class="content">
                  <h2>Hi ${user.name || user.username || "there"}!</h2>
                  <p>Your ticket for <strong>${event.title}</strong> has been confirmed. We can't wait to see you there!</p>
                  
                  <div class="event-details">
                    <div class="detail-row">
                      <span class="label">Event:</span>
                      <span class="value">${event.title}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Date:</span>
                      <span class="value">${new Date(
                        event.startDate || event.date
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Time:</span>
                      <span class="value">${event.startTime || "Check event details"}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Location:</span>
                      <span class="value">${event.location || "Online Event"}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Ticket Type:</span>
                      <span class="value">${pricingType || "Standard"}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Quantity:</span>
                      <span class="value">${quantity}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Price per ticket:</span>
                      <span class="value">₦${ticketPrice.toLocaleString()}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Total paid:</span>
                      <span class="value">₦${(
                        ticketPrice * quantity
                      ).toLocaleString()}</span>
                    </div>
                  </div>

                  <div class="qr-section">
                    <h3 style="color: #ec4899; margin-bottom: 15px;">Your QR Code</h3>
                    <p style="color: #64748b; margin-bottom: 20px;">Show this QR code at the entrance for quick check-in</p>
                    <img src="cid:qr-code" alt="QR Code" class="qr-code" />
                  </div>

                  <div style="text-align: center;">
                    <a href="${FRONTEND_URL}/my-tickets" class="button">View My Tickets</a>
                  </div>
                </div>
                <div class="footer">
                  <p>Reference: ${reference}</p>
                  <p>© ${new Date().getFullYear()} TickiSpot. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          attachments: [
            {
              filename: "qr-code.png",
              content: qrBuffer,
              cid: "qr-code", // Content ID for embedding
            },
          ],
        });

        if (buyerEmailResult.success) {
          console.log("✅ Email sent to buyer:", user.email);
        } else {
          console.error("❌ Failed to send email to buyer:", buyerEmailResult.error);
        }
      } catch (emailError) {
        console.error("❌ Exception sending email to buyer:", emailError);
      }

      // ===== CREATE NOTIFICATION FOR BUYER =====
      try {
        const buyerNotification = new Notification({
          user: finalUserId,
          type: "ticket_purchase",
          message: `🎟️ Ticket purchase confirmed for "${event.title}" - ${quantity} ticket(s) for ₦${(
            ticketPrice * quantity
          ).toLocaleString()}`,
        });
        await buyerNotification.save();

        // Emit real-time notification if socket.io is available
        const io = req.app.get("io");
        if (io) {
          io.to(`user_${finalUserId}`).emit("new_notification", buyerNotification);
        }

        console.log("✅ Notification created for buyer:", finalUserId);
      } catch (buyerNotifError) {
        console.error("❌ Failed to create buyer notification:", buyerNotifError);
      }

      // ===== CREATE NOTIFICATION FOR ORGANIZER =====
      try {
        const notification = new Notification({
          user: event.createdBy,
          type: "ticket",
          message: `🎟️ New ticket sale for "${event.title}" - ${quantity} ticket(s) sold for ₦${(
            ticketPrice * quantity
          ).toLocaleString()}`,
        });
        await notification.save();

        // Emit real-time notification if socket.io is available
        const io = req.app.get("io");
        if (io) {
          io.to(`user_${event.createdBy}`).emit("new_notification", notification);
        }

        console.log("✅ Notification created for organizer:", event.createdBy);
      } catch (notifError) {
        console.error("❌ Failed to create organizer notification:", notifError);
      }

      // ===== SEND EMAIL TO ORGANIZER =====
      try {
        const organizerEmailResult = await sendEmail({
          to: organizer.email,
          subject: "🎟️ New Ticket Sale - TickiSpot",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: 'Inter', sans-serif; background: #f9fafb; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
                .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 28px; }
                .content { padding: 40px 30px; }
                .sale-details { background: #f8fafc; border-radius: 16px; padding: 20px; margin: 20px 0; }
                .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
                .detail-row:last-child { border-bottom: none; }
                .label { color: #64748b; font-weight: 500; }
                .value { color: #0f172a; font-weight: 600; }
                .footer { text-align: center; padding: 30px; background: #f1f5f9; color: #64748b; }
                .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; border-radius: 30px; font-weight: 600; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎟️ New Ticket Sale!</h1>
                </div>
                <div class="content">
                  <h2>Hi ${organizer.name || organizer.username || "there"}!</h2>
                  <p>Great news! Someone just purchased tickets for your event.</p>
                  
                  <div class="sale-details">
                    <h3 style="color: #10b981; margin-bottom: 15px;">Sale Summary</h3>
                    <div class="detail-row">
                      <span class="label">Event:</span>
                      <span class="value">${event.title}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Buyer:</span>
                      <span class="value">${user.name || user.username || user.email}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Quantity:</span>
                      <span class="value">${quantity}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Ticket Type:</span>
                      <span class="value">${pricingType || "Standard"}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Price per ticket:</span>
                      <span class="value">₦${ticketPrice.toLocaleString()}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Total Amount:</span>
                      <span class="value">₦${(
                        ticketPrice * quantity
                      ).toLocaleString()}</span>
                    </div>
                  </div>

                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${FRONTEND_URL}/organizer/events/${event._id}" class="button">View Event Dashboard</a>
                  </div>
                </div>
                <div class="footer">
                  <p>Reference: ${reference}</p>
                  <p>© ${new Date().getFullYear()} TickiSpot. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        if (organizerEmailResult.success) {
          console.log("✅ Email sent to organizer:", organizer.email);
        } else {
          console.error("❌ Failed to send email to organizer:", organizerEmailResult.error);
        }
      } catch (organizerEmailError) {
        console.error("❌ Exception sending email to organizer:", organizerEmailError);
      }

      console.log("✅ Ticket created successfully, redirecting to success page");
      return res.redirect(successURL);
    }

    console.log("❌ Payment failed or pending, redirecting to failed page");
    return res.redirect(failedURL);
  } catch (error) {
    console.error("❌ Payment verification error:", error.message, error.stack);
    if (error.response) {
      console.error("📡 Paystack error:", error.response.data);
    }
    return res
      .status(500)
      .json({ message: "Verification failed", error: error.message });
  }
};