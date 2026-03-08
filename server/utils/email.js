// utils/email.js
const nodemailer = require("nodemailer");

// Create transporter based on environment
const createTransporter = () => {
  // For development/testing - use Ethereal (fake SMTP)
  if (process.env.NODE_ENV === "development" && !process.env.SMTP_HOST) {
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

  // For production - use your SMTP settings
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Only for development
    },
  });
};

async function sendEmail({ to, subject, html, attachments = [], from = null }) {
  try {
    // Validate inputs
    if (!to) throw new Error("Recipient email is required");
    if (!subject) throw new Error("Email subject is required");
    if (!html) throw new Error("Email content is required");

    const transporter = createTransporter();

    const mailOptions = {
      from: from || process.env.SMTP_FROM || '"TickiSpot" <noreply@tickispot.com>',
      to,
      subject,
      html,
      attachments: attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        cid: att.cid, // For embedded images
      })),
    };

    console.log(`📧 Attempting to send email to: ${to}`);
    const info = await transporter.sendMail(mailOptions);

    // For Ethereal, log the preview URL
    if (process.env.NODE_ENV === "development" && info.messageId) {
      console.log("📧 Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    console.log(`✅ Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId, preview: nodemailer.getTestMessageUrl(info) };
  } catch (error) {
    console.error("❌ Email sending failed:");
    console.error("  - To:", to);
    console.error("  - Subject:", subject);
    console.error("  - Error:", error.message);

    if (error.response) {
      console.error("  - SMTP Response:", error.response);
    }

    return { success: false, error: error.message };
  }
}

module.exports = sendEmail;