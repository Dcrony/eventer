const { Resend } = require("resend");

/**
 * Send transactional email via Resend (https://resend.com)
 * Set RESEND_API_KEY and RESEND_FROM in your .env file
 */
async function sendEmail({
  to,
  subject,
  html,
  attachments = [],
  from = null,
  retries = 2,
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const defaultFrom = from || process.env.RESEND_FROM || "TickiSpot <onboarding@resend.dev>";

  // Input validation
  if (!to) return { success: false, error: "Recipient email is required" };
  if (!subject) return { success: false, error: "Email subject is required" };
  if (!html) return { success: false, error: "Email content is required" };

  if (!apiKey) {
    console.warn("⚠️ RESEND_API_KEY is not set. Email not sent.");
    return { success: false, error: "Email not configured" };
  }

  // Initialize Resend client
  const resend = new Resend(apiKey);

  let attempt = 0;

  while (attempt <= retries) {
    try {
      // Prepare email data
      const emailData = {
        from: defaultFrom,
        to: [to], // Resend accepts an array of recipients
        subject: subject,
        html: html,
      };

      // Add attachments if any (Resend supports attachments)
      if (attachments && attachments.length > 0) {
        emailData.attachments = attachments.map(att => ({
          filename: att.filename,
          content: att.content, // Base64 encoded content
        }));
      }

      // Send email
      const { data, error } = await resend.emails.send(emailData);

      if (error) {
        throw new Error(error.message);
      }

      console.log(`✅ Email sent via Resend to ${to}`, data?.id);
      return {
        success: true,
        messageId: data?.id || null,
      };
    } catch (error) {
      attempt++;
      console.error(
        `❌ Resend attempt ${attempt} failed for ${to}:`,
        error.message
      );

      if (attempt > retries) {
        return { success: false, error: error.message };
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return { success: false, error: "Email send failed" };
}

module.exports = sendEmail;