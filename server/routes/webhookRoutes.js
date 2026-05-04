const express = require("express");
const router = express.Router();
const { handlePaystackWebhook } = require("../controllers/webhookController");

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET; // Add this to .env

// POST /api/webhooks/resend
router.post("/webhooks/resend", async (req, res) => {
  let rawBody = req.rawBody || JSON.stringify(req.body); // Important for verification

  try {
    // === 1. Verify the webhook signature (SECURITY) ===
    if (WEBHOOK_SECRET) {
      const event = resend.webhooks.verify({
        payload: rawBody,
        headers: {
          "svix-id": req.headers["svix-id"],
          "svix-timestamp": req.headers["svix-timestamp"],
          "svix-signature": req.headers["svix-signature"],
        },
        secret: WEBHOOK_SECRET,
      });

      console.log("✅ Webhook verified successfully");
    } else {
      console.warn("⚠️ No RESEND_WEBHOOK_SECRET set - skipping verification (not recommended in production)");
    }

    const event = req.body;

    // === 2. Handle only email.received events ===
    if (event.type === "email.received") {
      const emailData = event.data;

      const toAddresses = Array.isArray(emailData.to) 
        ? emailData.to 
        : [emailData.to];

      // Check for support email
      const isSupportEmail = toAddresses.some(addr => 
        addr.includes("support@tickispot.com") || 
        addr.includes("support@") || 
        addr.includes("@inbox.tickispot.com")
      );

      if (isSupportEmail) {
        console.log("📧 New Support Email Received:", {
          from: emailData.from,
          subject: emailData.subject,
          emailId: emailData.email_id
        });

        // TODO: Add your logic here
        // Example:
        // await createSupportTicket({
        //   emailId: emailData.email_id,
        //   from: emailData.from,
        //   subject: emailData.subject,
        //   // You can later fetch full content using emailData.email_id
        // });

        // Optional: Send notification to admin (your Gmail)
        // await sendEmail({
        //   to: "ibrahimabdulmajeed@gmail.com",
        //   subject: `New Support: ${emailData.subject}`,
        //   html: `<p>From: ${emailData.from}</p><p>Subject: ${emailData.subject}</p>`
        // });
      }
    }

    // Always return 200 OK quickly
    res.sendStatus(200);

  } catch (error) {
    console.error("❌ Webhook verification or processing failed:", error.message);
    
    // Still return 200 to avoid Resend retrying endlessly (or use 400 for bad requests)
    res.sendStatus(200);
  }
});

// IMPORTANT: Must use raw body for signature verification
router.post(
  "/paystack",
  express.raw({ type: "application/json" }),
  handlePaystackWebhook
);

module.exports = router;