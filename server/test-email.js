// test-email.js
require("dotenv").config();
const sendEmail = require("./utils/email");

async function testEmail() {
  console.log("🔍 Testing email configuration...");
  console.log("SMTP Host:", process.env.EMAIL_HOST || process.env.SMTP_HOST);
  console.log("SMTP User:", process.env.EMAIL_USER || process.env.SMTP_USER);
  console.log("SMTP From:", process.env.EMAIL_FROM || process.env.SMTP_FROM);

  try {
    const result = await sendEmail({
      to: "tickispot@gmail.com", // Replace with your email
      subject: "🎟️ TickiSpot Test Email",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Inter', sans-serif; background: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #ec4899, #f43f5e); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .success-box { background: #f0fdf4; border: 2px solid #86efac; border-radius: 16px; padding: 20px; text-align: center; }
            .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #ec4899, #f43f5e); color: white; text-decoration: none; border-radius: 30px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email Working!</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <h2 style="color: #166534;">TickiSpot Email Test</h2>
                <p style="color: #166534; font-size: 18px;">Your email configuration is working correctly!</p>
                <p style="color: #374151; margin-top: 20px;">You're ready to send ticket confirmations and notifications.</p>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <a href="#" class="button">View Dashboard</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (result.success) {
      console.log("✅ Test email sent successfully!");
      if (result.preview) {
        console.log("📧 Preview URL:", result.preview);
      }
    } else {
      console.log("❌ Test email failed:", result.error);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testEmail();