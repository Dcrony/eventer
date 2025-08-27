// utils/email.js
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, html, attachments = []) {
  try {
    const msg = {
      to,
      from: process.env.SENDGRID_SENDER, // must be a verified sender in SendGrid
      subject,
      html,
      attachments, // for QR code PDF/PNG
    };

    await sgMail.send(msg);
    console.log("✅ Email sent to", to);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
}

module.exports = sendEmail;
