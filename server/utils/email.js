const { Resend } = require("resend");

/**
 * Send transactional email via Resend (https://resend.com).
 * Set RESEND_API_KEY and RESEND_FROM (e.g. TickiSpot <onboarding@yourdomain.com>).
 */
async function sendEmail({ to, subject, html, attachments = [], from = null, retries = 2 }) {
  const apiKey = process.env.RESEND_API_KEY;
  const defaultFrom =
    from ||
    process.env.RESEND_FROM ||
    process.env.EMAIL_FROM ||
    "TickiSpot <onboarding@resend.dev>";

  if (!to) return { success: false, error: "Recipient email is required" };
  if (!subject) return { success: false, error: "Email subject is required" };
  if (!html) return { success: false, error: "Email content is required" };

  if (!apiKey) {
    console.warn("⚠️ RESEND_API_KEY is not set. Email not sent.");
    return { success: false, error: "Email not configured" };
  }

  const resend = new Resend(apiKey);

  const payloadAttachments = (attachments || []).map((att) => {
    let content = att.content;
    if (Buffer.isBuffer(content)) {
      content = content.toString("base64");
    }
    return {
      filename: att.filename,
      content,
      ...(att.cid ? { content_id: att.cid } : {}),
    };
  });

  let attempt = 0;
  while (attempt <= retries) {
    try {
      const { data, error } = await resend.emails.send({
        from: defaultFrom,
        to: [to],
        subject,
        html,
        attachments: payloadAttachments.length ? payloadAttachments : undefined,
      });

      if (error) throw new Error(error.message || JSON.stringify(error));

      console.log(`✅ Email sent via Resend to ${to}. Id: ${data?.id}`);
      return { success: true, messageId: data?.id };
    } catch (error) {
      attempt++;
      console.error(`❌ Resend attempt ${attempt} failed for ${to}:`, error.message);
      if (attempt > retries) {
        return { success: false, error: error.message };
      }
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return { success: false, error: "Email send failed" };
}

module.exports = sendEmail;
