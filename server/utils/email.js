// utils/email.js - Using Mailgun SDK
const formData = require('form-data');
const Mailgun = require('mailgun.js');

async function sendEmail(to, subject, html, attachments = []) {
  try {
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
      url: process.env.MAILGUN_REGION === 'EU' 
        ? 'https://api.eu.mailgun.net' 
        : 'https://api.mailgun.net'
    });

    const msg = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `"TickiSpot" <noreply@${process.env.MAILGUN_DOMAIN}>`,
      to: [to],
      subject: subject,
      html: html,
      attachment: attachments.map(att => ({
        filename: att.filename,
        data: att.content
      }))
    });

    console.log(`✅ Email sent to ${to}:`, msg.id);
    return true;
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return false;
  }
}

module.exports = sendEmail;