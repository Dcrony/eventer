const { Resend } = require("resend");
const EmailLog = require("../models/EmailLog");

async function recordEmailLog(logData) {
  try {
    await EmailLog.create(logData);
  } catch (err) {
    console.warn("⚠️ Failed to write email log:", err.message || err);
  }
}

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
  type = "general",
  relatedType = null,
  relatedId = null,
  metadata = {},
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const defaultFrom = from || process.env.RESEND_FROM || "TickiSpot <onboarding@resend.dev>";

  // Input validation
  if (!to) return { success: false, error: "Recipient email is required" };
  if (!subject) return { success: false, error: "Email subject is required" };
  if (!html) return { success: false, error: "Email content is required" };

  if (!apiKey) {
    console.warn("⚠️ RESEND_API_KEY is not set. Email not sent.");
    await recordEmailLog({
      type,
      recipient: to,
      subject,
      status: "failed",
      provider: "resend",
      error: "Email not configured",
      attempts: 0,
      lastAttemptAt: new Date(),
      relatedType,
      relatedId,
      metadata,
    });
    return { success: false, error: "Email not configured" };
  }

  const resend = new Resend(apiKey);
  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      const emailData = {
        from: defaultFrom,
        to: [to],
        subject,
        html,
      };

      if (attachments && attachments.length > 0) {
        emailData.attachments = attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
        }));
      }

      const { data, error } = await resend.emails.send(emailData);
      if (error) {
        throw new Error(error.message || "Unknown email provider error");
      }

      console.log(`✅ Email sent via Resend to ${to}`, data?.id);
      await recordEmailLog({
        type,
        recipient: to,
        subject,
        status: "sent",
        provider: "resend",
        providerId: data?.id || null,
        attempts: attempt + 1,
        lastAttemptAt: new Date(),
        relatedType,
        relatedId,
        metadata,
      });

      return {
        success: true,
        messageId: data?.id || null,
      };
    } catch (error) {
      attempt += 1;
      lastError = error;
      console.error(`❌ Resend attempt ${attempt} failed for ${to}:`, error.message || error);

      if (attempt > retries) {
        await recordEmailLog({
          type,
          recipient: to,
          subject,
          status: "failed",
          provider: "resend",
          error: error.message || String(error),
          attempts: attempt,
          lastAttemptAt: new Date(),
          relatedType,
          relatedId,
          metadata,
        });
        return { success: false, error: error.message || String(error) };
      }

      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  await recordEmailLog({
    type,
    recipient: to,
    subject,
    status: "failed",
    provider: "resend",
    error: lastError?.message || "Email send failed",
    attempts: attempt,
    lastAttemptAt: new Date(),
    relatedType,
    relatedId,
    metadata,
  });
  return { success: false, error: "Email send failed" };
}

module.exports = sendEmail;