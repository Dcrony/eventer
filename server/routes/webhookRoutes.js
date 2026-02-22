const express = require("express");
const router = express.Router();
const { handlePaystackWebhook } = require("../controllers/webhookController");

const crypto = require("crypto");

const hash = crypto
  .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
  .update(JSON.stringify(req.body))
  .digest("hex");

if (hash !== req.headers["x-paystack-signature"]) {
  return res.sendStatus(400);
}



router.post("/", express.raw({ type: "application/json" }), handlePaystackWebhook);

router.post("/webhook/paystack", async (req, res) => {
  const event = req.body;

  if (event.event === "transfer.success") {
    const reference = event.data.reference;

    const withdrawal = await Withdrawal.findOne({
      paystackReference: reference,
    }).populate("organizer");

    if (!withdrawal) return res.sendStatus(200);

    const organizer = withdrawal.organizer;

    // Deduct balance now
    organizer.availableBalance -= withdrawal.amount;
    await organizer.save();

    withdrawal.status = "completed";
    await withdrawal.save();

    await Transaction.findOneAndUpdate(
      { referenceId: withdrawal._id, type: "withdrawal" },
      { status: "completed" }
    );
  }

  if (event.event === "transfer.failed") {
    const reference = event.data.reference;

    const withdrawal = await Withdrawal.findOne({
      paystackReference: reference,
    });

    if (withdrawal) {
      withdrawal.status = "failed";
      await withdrawal.save();

      await Transaction.findOneAndUpdate(
        { referenceId: withdrawal._id, type: "withdrawal" },
        { status: "failed" }
      );
    }
  }

  res.sendStatus(200);
});

module.exports = router;
