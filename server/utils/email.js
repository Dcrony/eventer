// utils/email.js
const nodemailer = require("nodemailer");

/**
 * Create transporter based on environment
 * Forces IPv4 to avoid ENETUNREACH issues in environments without IPv6 support
 */
const createTransporter = () => {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587");
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const secure = process.env.EMAIL_SECURE === "true" || process.env.SMTP_SECURE === "true" || port === 465;

  // For development/testing - use Ethereal (fake SMTP) if no real credentials provided
  if (process.env.NODE_ENV === "development" && !host) {
    console.log("ℹ️ No SMTP credentials found, using Ethereal for development.");
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER || "your-ethereal-user",
        pass: process.env.ETHEREAL_PASS || "your-ethereal-pass",
      },
    });
  }

  if (!host || !user || !pass) {
    console.warn("⚠️ Email configuration is incomplete. Emails may not be sent.");
  }

  // For production - use SMTP settings
  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: secure,
    auth: {
      user: user,
      pass: pass,
    },
    // CRITICAL: Force IPv4 to avoid ENETUNREACH on IPv6
    family: 4,
    tls: {
      // Do not fail on invalid certs (common with some SMTP providers)
      rejectUnauthorized: process.env.NODE_ENV === "production" ? true : false,
    },
    // Increase timeouts for better reliability
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

/**
 * Sends an email with retry logic and fail-safe error handling
 */
async function sendEmail({ to, subject, html, attachments = [], from = null, retries = 2 }) {
  const mailOptions = {
    from: from || process.env.EMAIL_FROM || process.env.SMTP_FROM || '"TickiSpot" <noreply@tickispot.com>',
    to,
    subject,
    html,
    attachments: attachments.map((att) => ({
      filename: att.filename,
      content: att.content,
      cid: att.cid,
    })),
  };

  let attempt = 0;
  while (attempt <= retries) {
    try {
      // Validate inputs
      if (!to) throw new Error("Recipient email is required");
      if (!subject) throw new Error("Email subject is required");
      if (!html) throw new Error("Email content is required");

      const transporter = createTransporter();
      
      console.log(`📧 [Attempt ${attempt + 1}] Sending email to: ${to} | Subject: ${subject}`);
      
      const info = await transporter.sendMail(mailOptions);

      if (process.env.NODE_ENV === "development" && info.messageId && info.host === "smtp.ethereal.email") {
        console.log("📧 Preview URL:", nodemailer.getTestMessageUrl(info));
      }

      console.log(`✅ Email sent successfully to ${to}. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      attempt++;
      console.error(`❌ Email attempt ${attempt} failed for ${to}:`, error.message);
      
      if (attempt > retries) {
        console.error("🚨 All email retry attempts failed.");
        // We return success: false but don't THROW, so the main flow continues
        return { success: false, error: error.message };
      }
      
      // Wait a bit before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = sendEmail;