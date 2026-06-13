const express = require("express");
const router = express.Router();
const sendEmail = require("../services/emailService"); // adjust path if needed

/**
 * POST /api/contact
 * Body: { name, email, message }
 * Forwards the message to ADMIN_NOTIFICATION_EMAIL via Resend
 */
router.post("/", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: "All fields are required." });
  }

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    console.error("ADMIN_NOTIFICATION_EMAIL is not set in .env");
    return res.status(500).json({ success: false, error: "Server misconfiguration." });
  }

  const result = await sendEmail({
    to: adminEmail,
    subject: `[TickiSpot Contact] Message from ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <div style="background:linear-gradient(135deg,#ec4899,#a855f7);border-radius:8px;padding:20px 24px;margin-bottom:24px;">
          <h2 style="color:#fff;margin:0;font-size:20px;">New Contact Message</h2>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">via TickiSpot contact form</p>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
          <tr>
            <td style="padding:10px 0;color:#6b7280;font-weight:600;width:80px;">Name</td>
            <td style="padding:10px 0;color:#111827;">${name}</td>
          </tr>
          <tr style="border-top:1px solid #f3f4f6;">
            <td style="padding:10px 0;color:#6b7280;font-weight:600;">Email</td>
            <td style="padding:10px 0;">
              <a href="mailto:${email}" style="color:#ec4899;text-decoration:none;">${email}</a>
            </td>
          </tr>
        </table>

        <div style="background:#f9fafb;border-left:3px solid #ec4899;border-radius:6px;padding:16px 20px;">
          <p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
          <p style="margin:0;color:#111827;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</p>
        </div>

        <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">
          Reply directly to <a href="mailto:${email}" style="color:#ec4899;">${email}</a> to respond.
        </p>
      </div>
    `,
    type: "contact",
    metadata: { senderName: name, senderEmail: email },
  });

  if (!result.success) {
    return res.status(500).json({ success: false, error: "Failed to send message. Please try again." });
  }

  return res.status(200).json({ success: true, message: "Message sent successfully." });
});

module.exports = router;