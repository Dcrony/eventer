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
    | TRANSFER SUCCESS (Withdrawal Completed)
    |--------------------------------------------------------------------------
    */
    if (event.event === "transfer.success") {
      const reference = event.data.reference;

      const withdrawal = await Withdrawal.findOne({
        paystackReference: reference,
      });

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

      console.log("❌ Withdrawal failed and refunded:", reference);
    }

    res.sendStatus(200);

  } catch (error) {
    console.error("Webhook Error:", error.message);
    res.sendStatus(500);
  }
};