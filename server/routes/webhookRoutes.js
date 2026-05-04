const express = require("express");
const router = express.Router();
const { handlePaystackWebhook } = require("../controllers/webhookController");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

const SupportTicket = require("../models/Support"); // ← Adjust path to your model
const sendEmail = require("../utils/sendEmail"); // your existing sendEmail function

router.post("/webhooks/resend", async (req, res) => {
  const rawBody = req.rawBody || JSON.stringify(req.body);

  try {
    // Verify webhook signature
    if (WEBHOOK_SECRET) {
      resend.webhooks.verify({
        payload: rawBody,
        headers: {
          "svix-id": req.headers["svix-id"],
          "svix-timestamp": req.headers["svix-timestamp"],
          "svix-signature": req.headers["svix-signature"],
        },
        secret: WEBHOOK_SECRET,
      });
    }

    const event = req.body;

    if (event.type === "email.received") {
      const emailData = event.data;
      const emailId = emailData.email_id;

      // Fetch FULL email content (body + attachments)
      const { data: fullEmail } = await resend.emails.receiving.get(emailId);

      const toAddresses = Array.isArray(emailData.to) ? emailData.to : [emailData.to];

      const isSupportEmail = toAddresses.some(addr =>
        addr.toLowerCase().includes("support@tickispot.com") ||
        addr.toLowerCase().includes("@inbox.tickispot.com")
      );

      if (isSupportEmail) {
        // === CREATE SUPPORT TICKET ===
        const ticket = new SupportTicket({
          ticketId: `TKT-${Date.now().toString().slice(-8)}`,
          emailId: emailId,
          from: emailData.from,
          fromName: fullEmail.from?.name || emailData.from,
          subject: emailData.subject,
          message: fullEmail.text || fullEmail.html?.replace(/<[^>]*>/g, "") || "", // plain text fallback
          html: fullEmail.html,
          rawEmail: fullEmail,                    // optional: store everything
          attachments: fullEmail.attachments || [],
          status: "open",
          priority: "normal",
          // Link to existing user if possible
          // user: existingUser?._id,
        });

        await ticket.save();

        console.log(`✅ New Support Ticket Created: ${ticket.ticketId} | ${emailData.subject}`);

        // Optional: Notify you (admin)
        await sendEmail({
          to: "ibrahimabdulmajeed@gmail.com",
          subject: `New Support Ticket #${ticket.ticketId} - ${emailData.subject}`,
          html: `
            <p><strong>From:</strong> ${emailData.from}</p>
            <p><strong>Subject:</strong> ${emailData.subject}</p>
            <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
            <hr>
            <p>${fullEmail.text || "No plain text content"}</p>
          `,
        });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook Error:", error.message);
    res.sendStatus(200); // Always return 200 to stop Resend retries
  }
});

// IMPORTANT: Must use raw body for signature verification
router.post(
  "/paystack",
  express.raw({ type: "application/json" }),
  handlePaystackWebhook
);

module.exports = router;