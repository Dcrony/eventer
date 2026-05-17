const crypto = require("crypto");
const axios = require("axios");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");
const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const User = require("../models/User");
const BillingHistory = require("../models/BillingHistory");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/email");
const { recordTicketPurchaseMetrics } = require("./eventController");
const { splitTicketSaleForOrganizer } = require("../utils/platformFee");
const {
  normalizePlan,
  normalizeInterval,
  getPlanAmount,
  syncUserBillingState,
  upsertBillingHistory,
} = require("../services/billingService");
const {
  computeTicketOrderTotal,
  amountsMatch,
} = require("../utils/ticketPricing");

exports.handlePaystackWebhook = async (req, res) => {
  try {
    const secret =
      process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET;

    if (!secret) {
      console.error("PAYSTACK_SECRET_KEY / PAYSTACK_SECRET is not set");
      return res.status(500).send("Server misconfigured");
    }

    // 1️⃣ Verify signature using RAW BODY
    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.body) // DO NOT stringify
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).send("Invalid signature");
    }

    // 2️⃣ Parse event manually
    const event = JSON.parse(req.body.toString());

    /*
    |--------------------------------------------------------------------------
    | CHARGE SUCCESS (Payment Completed)
    |--------------------------------------------------------------------------
    */
    if (event.event === "charge.success") {
      const reference = event.data.reference;
      const data = event.data;
      const metadata = data.metadata || {};

      if (metadata.type === "subscription_upgrade") {
        // Check for idempotency - if already processed, ignore
        const existingHistory = await BillingHistory.findOne({ reference });
        if (existingHistory && existingHistory.status === "success") {
          console.log("⚠️ Subscription payment already processed for reference:", reference);
          return res.sendStatus(200);
        }

        // Verify transaction with Paystack API
        try {
          const verifyResponse = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
              headers: {
                Authorization: `Bearer ${secret}`,
              },
            },
          );
          const verifiedData = verifyResponse.data?.data;
          if (!verifiedData || verifiedData.status !== "success") {
            console.error("❌ Paystack verification failed for reference:", reference);
            return res.sendStatus(200);
          }
        } catch (verifyError) {
          console.error("❌ Error verifying transaction with Paystack:", verifyError.message);
          return res.sendStatus(200);
        }

        const user = await User.findById(metadata.userId);
        if (!user) {
          console.error("❌ Subscription webhook user not found:", metadata.userId);
          return res.sendStatus(200);
        }

        const normalizedPlan = normalizePlan(metadata.plan);
        const normalizedInterval = normalizeInterval(metadata.interval);
        const amount = getPlanAmount(normalizedPlan, normalizedInterval) || data.amount / 100;

        await syncUserBillingState({
          user,
          plan: normalizedPlan,
          interval: normalizedInterval,
          status: "active",
          reference,
          customerCode: data.customer?.customer_code || "",
          subscriptionCode: data.subscription?.subscription_code || "",
          effectiveDate: new Date(data.paid_at || Date.now()),
        });

        await upsertBillingHistory({
          userId: user._id,
          plan: normalizedPlan,
          amount,
          interval: normalizedInterval,
          status: "success",
          reference,
          paystackCustomerId: data.customer?.customer_code || "",
          paystackSubscriptionCode: data.subscription?.subscription_code || "",
          metadata,
        });

        console.log("✅ Subscription payment processed for reference:", reference);
        return res.sendStatus(200);
      }

      // Check if ticket already created to prevent duplicates
      const existingTicket = await Ticket.findOne({ reference });
      if (existingTicket) {
        console.log("⚠️ Ticket already exists for reference:", reference);
        return res.sendStatus(200);
      }

      let { eventId, userId, quantity, pricingType } = data.metadata;

      quantity = parseInt(quantity, 10);

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
        console.error("❌ Incomplete metadata in webhook");
        return res.sendStatus(200);
      }

      // Fetch event and user
      const eventDoc = await Event.findById(eventId);
      const user = await User.findById(finalUserId);

      if (!eventDoc || !user) {
        console.error("❌ Invalid event or user in webhook");
        return res.sendStatus(200);
      }

      if (eventDoc.totalTickets < quantity) {
        console.error("❌ Not enough tickets available in webhook");
        return res.sendStatus(200);
      }

      const order = computeTicketOrderTotal(eventDoc, { pricingType, quantity });
      if (!amountsMatch(data.amount, order.totalKobo)) {
        console.error("❌ Webhook payment amount mismatch", {
          paid: data.amount,
          expected: order.totalKobo,
          reference,
        });
        return res.sendStatus(200);
      }

      const ticketPrice = order.unitPrice;

      // Create ticket
      const ticket = new Ticket({
        event: eventId,
        buyer: finalUserId,
        quantity,
        price: ticketPrice,
        amount: ticketPrice * quantity,
        amountPaid: ticketPrice * quantity,
        paymentStatus: "paid",
        isFree: false,
        reference,
        ticketType: pricingType,
      });

      await ticket.save();

      const grossNaira = data.amount / 100;
      const { platformFee, netToOrganizer } = splitTicketSaleForOrganizer(grossNaira);

      const organizer = await User.findById(eventDoc.createdBy);

      if (organizer) {
        organizer.availableBalance += netToOrganizer;
        await organizer.save();
      }

      // Update event tickets
      eventDoc.ticketsSold += quantity;
      eventDoc.totalTickets -= quantity;
      recordTicketPurchaseMetrics(eventDoc, quantity, ticketPrice * quantity);
      await eventDoc.save();

      // Create transaction record (amount = buyer total; fee = platform commission)
      await Transaction.create({
        organizer: eventDoc.createdBy,
        type: "ticket",
        amount: grossNaira,
        fee: platformFee,
        status: "success",
        reference: data.reference,
        metadata: {
          eventId: eventDoc._id,
          ticketId: ticket._id,
        },
      });

      // Generate QR code
      const QRCode = require("qrcode");
      const fs = require("fs");
      const path = require("path");
      const qrDir = path.join(__dirname, "../uploads/qrcodes");
      if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

      const FRONTEND_URL = process.env.FRONTEND_URL;
      const qrData = `${FRONTEND_URL}/validate/${ticket._id}`;
      const qrFileName = `${ticket._id}.png`;
      const qrPath = path.join(qrDir, qrFileName);
      await QRCode.toFile(qrPath, qrData);
      
      // Read QR code as buffer for email attachment
      const qrBuffer = fs.readFileSync(qrPath);
      
      ticket.qrCode = `qrcodes/${qrFileName}`;
      await ticket.save();

      // Send email to buyer
      const sendEmail = require("../utils/email");
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
                  <p>Your ticket for <strong>${eventDoc.title}</strong> has been confirmed. We can't wait to see you there!</p>
                  
                  <div class="event-details">
                    <div class="detail-row">
                      <span class="label">Event:</span>
                      <span class="value">${eventDoc.title}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Date:</span>
                      <span class="value">${new Date(
                        eventDoc.startDate || eventDoc.date
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Time:</span>
                      <span class="value">${eventDoc.startTime || "Check event details"}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Location:</span>
                      <span class="value">${eventDoc.location || "Online Event"}</span>
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
              cid: "qr-code",
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

      // Create notification for buyer
      try {
        const buyerNotification = new Notification({
          user: finalUserId,
          type: "ticket_purchase",
          message: `🎟️ Ticket purchase confirmed for "${eventDoc.title}" - ${quantity} ticket(s) for ₦${(
            ticketPrice * quantity
          ).toLocaleString()}`,
        });
        await buyerNotification.save();

        // Emit real-time notification if socket.io is available
        const io = req.app.get("io");
        if (io?.emitToUser) {
          io.emitToUser(finalUserId, "new_notification", buyerNotification.toJSON());
        }

        console.log("✅ Notification created for buyer:", finalUserId);
      } catch (buyerNotifError) {
        console.error("❌ Failed to create buyer notification:", buyerNotifError);
      }

      // Create notification for organizer
      try {
        const notification = new Notification({
          user: eventDoc.createdBy,
          type: "ticket",
          message: `🎟️ New ticket sale for "${eventDoc.title}" - ${quantity} ticket(s) sold for ₦${(
            ticketPrice * quantity
          ).toLocaleString()}`,
        });
        await notification.save();

        // Emit real-time notification if socket.io is available
        const io = req.app.get("io");
        if (io?.emitToUser) {
          io.emitToUser(eventDoc.createdBy, "new_notification", notification.toJSON());
        }

        console.log("✅ Notification created for organizer:", eventDoc.createdBy);
      } catch (notifError) {
        console.error("❌ Failed to create organizer notification:", notifError);
      }

      // Send email to organizer
      if (organizer) {
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
                        <span class="value">${eventDoc.title}</span>
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
                      <a href="${FRONTEND_URL}/organizer/events/${eventDoc._id}" class="button">View Event Dashboard</a>
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
      }

      console.log("✅ Ticket created via webhook for reference:", reference);
    }

    if (event.event === "subscription.create") {
      const subscriptionData = event.data || {};
      const customerCode = subscriptionData.customer?.customer_code;
      const customerEmail = subscriptionData.customer?.email;
      const user = customerCode
        ? await User.findOne({ "subscription.paystackCustomerId": customerCode })
        : await User.findOne({ email: customerEmail });

      if (!user) {
        console.log("⚠️ Subscription create user not found");
        return res.sendStatus(200);
      }

      user.subscription = {
        ...user.subscription?.toObject?.(),
        status: subscriptionData.status === "active" ? "active" : "pending",
        interval: normalizeInterval(subscriptionData.plan?.interval || user.subscription?.interval),
        nextBillingDate: subscriptionData.next_payment_date
          ? new Date(subscriptionData.next_payment_date)
          : user.subscription?.nextBillingDate || null,
        paystackCustomerId: customerCode || user.subscription?.paystackCustomerId || "",
        paystackSubscriptionCode:
          subscriptionData.subscription_code || user.subscription?.paystackSubscriptionCode || "",
      };
      user.billing = {
        ...user.billing?.toObject?.(),
        paystackCustomerCode: customerCode || user.billing?.paystackCustomerCode || "",
        billingStatus: subscriptionData.status === "active" ? "active" : "pending",
        nextBillingDate: subscriptionData.next_payment_date
          ? new Date(subscriptionData.next_payment_date)
          : user.billing?.nextBillingDate || null,
      };
      await user.save();

      console.log("✅ Subscription created:", subscriptionData.subscription_code);
      return res.sendStatus(200);
    }

    if (event.event === "invoice.payment_success") {
      const invoiceData = event.data || {};
      const customerCode = invoiceData.customer?.customer_code;
      const customerEmail = invoiceData.customer?.email;
      const user = customerCode
        ? await User.findOne({ "subscription.paystackCustomerId": customerCode })
        : await User.findOne({ email: customerEmail });

      if (!user) {
        console.log("⚠️ Invoice payment user not found");
        return res.sendStatus(200);
      }

      const interval = normalizeInterval(
        invoiceData.subscription?.plan?.interval ||
          invoiceData.plan?.interval ||
          user.subscription?.interval,
      );
      const plan = normalizePlan(user.plan || "pro");
      const amount = Number(invoiceData.amount || 0) / 100 || getPlanAmount(plan, interval) || 0;
      const reference = invoiceData.reference || `INV-${user._id}-${Date.now()}`;

      await syncUserBillingState({
        user,
        plan,
        interval,
        status: "active",
        reference,
        customerCode: customerCode || "",
        subscriptionCode:
          invoiceData.subscription?.subscription_code || user.subscription?.paystackSubscriptionCode || "",
        effectiveDate: new Date(invoiceData.paid_at || Date.now()),
      });

      await upsertBillingHistory({
        userId: user._id,
        plan,
        amount,
        interval,
        status: "success",
        reference,
        paystackCustomerId: customerCode || "",
        paystackSubscriptionCode:
          invoiceData.subscription?.subscription_code || user.subscription?.paystackSubscriptionCode || "",
        metadata: { type: "invoice.payment_success", invoice: invoiceData.invoice_code || "" },
      });

      console.log("✅ Subscription invoice recorded:", reference);
      return res.sendStatus(200);
    }

    /*
    |--------------------------------------------------------------------------
    | TRANSFER SUCCESS (Withdrawal Completed)
    |--------------------------------------------------------------------------
    */
    if (event.event === "transfer.success") {
      const reference = event.data.reference;

      const withdrawal = await Withdrawal.findOne({
        paystackReference: reference,
      }).populate("organizer");

      if (!withdrawal || withdrawal.status === "completed") {
        return res.sendStatus(200);
      }

      withdrawal.status = "completed";
      await withdrawal.save();

      // Update transaction record
      await Transaction.findOneAndUpdate(
        { reference: reference, type: "withdrawal" },
        { status: "success" }
      );

      // Send success notification
      if (withdrawal.organizer) {
        await createNotification(req.app, {
          userId: withdrawal.organizer._id,
          type: "withdrawal_completed",
          message: `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} has been completed successfully`,
          actionUrl: "/transactions",
          entityId: withdrawal._id,
          entityType: "withdrawal",
        });
      }

      console.log("💸 Withdrawal completed:", reference);
    }

    /*
    |--------------------------------------------------------------------------
    | TRANSFER FAILED
    |--------------------------------------------------------------------------
    */
    if (event.event === "transfer.failed") {
      const reference = event.data.reference;

      const withdrawal = await Withdrawal.findOne({
        paystackReference: reference,
      }).populate("organizer");

      if (!withdrawal || withdrawal.status === "failed") {
        return res.sendStatus(200);
      }

      // REFUND BALANCE
      const organizer = withdrawal.organizer;
      if (organizer) {
        organizer.availableBalance += withdrawal.amount;
        await organizer.save();
      }

      withdrawal.status = "failed";
      withdrawal.failureReason = event.data.failure_reason || "Transfer failed";
      await withdrawal.save();

      // Update transaction record
      await Transaction.findOneAndUpdate(
        { reference: reference, type: "withdrawal" },
        { status: "failed" }
      );

      // Send failure notification
      if (organizer) {
        await createNotification(req.app, {
          userId: organizer._id,
          type: "withdrawal_failed",
          message: `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} failed: ${withdrawal.failureReason}`,
          actionUrl: "/transactions",
          entityId: withdrawal._id,
          entityType: "withdrawal",
        });
      }

      console.log("❌ Withdrawal failed and refunded:", reference);
    }

    res.sendStatus(200);

  } catch (error) {
    console.error("Webhook Error:", error.message);
    res.sendStatus(500);
  }
};
