const crypto = require("crypto");
const Ticket = require("../models/Ticket");
const Event = require("../models/Event");

exports.handlePaystackWebhook = async (req, res) => {
  // Verify signature
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("Unauthorized");
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const data = event.data;
    const { eventId, userId, quantity } = data.metadata;

    try {
      const targetEvent = await Event.findById(eventId);
      if (!targetEvent || targetEvent.totalTickets < quantity) return;

      // Create ticket
      const newTicket = new Ticket({
        event: eventId,
        user: userId,
        quantity,
      });

      await newTicket.save();

      // Reduce ticket count
      targetEvent.totalTickets -= quantity;
      await targetEvent.save();

      console.log("✅ Ticket issued for:", data.customer.email);
    } catch (err) {
      console.error("Webhook error:", err.message);
    }
  }

  res.sendStatus(200);
};
