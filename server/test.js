// test.js
require('dotenv').config();
const formData = require('form-data');
const Mailgun = require('mailgun.js');

async function test() {
  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY
  });

  try {
    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `TickiSpot <noreply@${process.env.MAILGUN_DOMAIN}>`,
      to: ['your-verified-email@gmail.com'], // Must be authorized!
      subject: '✅ Mailgun Working!',
      html: '<h1>Success!</h1><p>Mailgun is correctly configured for TickiSpot.</p>'
    });
    console.log('✅ Email sent:', result.id);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();