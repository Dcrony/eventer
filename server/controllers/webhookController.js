const crypto = require("crypto");
const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");
const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const User = require("../models/User");

exports.handlePaystackWebhook = async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;

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
    | PAYMENT SUCCESS (Ticket Purchase)
    |--------------------------------------------------------------------------
    */
    if (event.event === "charge.success") {
      const data = event.data;
      const { eventId, userId, quantity } = data.metadata;

      // Idempotency check
      const existingTransaction = await Transaction.findOne({
        paystackReference: data.reference,
      });

      if (existingTransaction) {
        return res.sendStatus(200);
      }

      const targetEvent = await Event.findById(eventId);

      if (!targetEvent || targetEvent.totalTickets < quantity) {
        return res.sendStatus(200);
      }

      // Create ticket
      await Ticket.create({
        event: eventId,
        user: userId,
        quantity,
      });

      // Reduce ticket count
      targetEvent.totalTickets -= quantity;
      await targetEvent.save();

      // Log transaction
      await Transaction.create({
        organizer: targetEvent.organizer,
        type: "ticket_purchase",
        amount: data.amount / 100,
        status: "completed",
        paystackReference: data.reference,
      });

      console.log("✅ Ticket issued:", data.customer.email);
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

      const organizer = withdrawal.organizer;

      // Deduct balance safely
      organizer.availableBalance -= withdrawal.amount;
      await organizer.save();

      withdrawal.status = "completed";
      await withdrawal.save();

      await Transaction.findOneAndUpdate(
        { referenceId: withdrawal._id, type: "withdrawal" },
        { status: "completed" }
      );

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
      });

      if (!withdrawal || withdrawal.status === "failed") {
        return res.sendStatus(200);
      }

      withdrawal.status = "failed";
      withdrawal.failureReason =
        event.data.failure_reason || "Transfer failed";

      await withdrawal.save();

      await Transaction.findOneAndUpdate(
        { referenceId: withdrawal._id, type: "withdrawal" },
        { status: "failed" }
      );

      console.log("❌ Withdrawal failed:", reference);
    }

    res.sendStatus(200);

  } catch (error) {
    console.error("Webhook Error:", error.message);
    res.sendStatus(500);
  }
};