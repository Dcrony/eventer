exports.welcomeEmail = (name) => `
  <h1>Welcome to TickiSpot 🎉</h1>
  <p>Hi ${name},</p>
  <p>Your account has been created successfully.</p>
  <p>Start exploring events, tickets, and livestreams 🚀</p>
`;

exports.otpEmail = (otp) => `
  <h2>Your TickiSpot Verification Code</h2>
  <h1 style="letter-spacing: 6px; font-size: 32px; color: #2563eb;">
    ${otp}
  </h1>
  <p>This code expires in 10 minutes.</p>
`;

exports.passwordResetEmail = (url) => `
  <h2>Password Reset Request</h2>
  <p>Click below to reset your password:</p>
  <a href="${url}">Reset Password</a>
  <p>This link expires in 1 hour.</p>
`;

exports.donationSuccessEmail = (name, amount, reference) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
    <h2 style="color: #ec4899;">Thank You for Your Support! 💖</h2>
    <p>Hi ${name},</p>
    <p>We've successfully received your donation of <strong>₦${amount}</strong>.</p>
    <p>Your support helps us keep TickiSpot growing and accessible for all event creators.</p>
    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #64748b;">Transaction Reference:</p>
      <p style="margin: 0; font-weight: bold; font-family: monospace;">${reference}</p>
    </div>
    <p>Stay awesome!<br>The TickiSpot Team</p>
  </div>
`;

exports.welcomeSuccessEmail = (name) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
    
    <h2 style="color: #ec4899;">🎉 Welcome to TickiSpot, ${name}!</h2>

    <p>Your account has been successfully verified and you're now officially part of the platform 🚀</p>

    <p>Here’s what you can do next:</p>

    <ul style="padding-left: 20px;">
      <li>🎟 Create and manage events</li>
      <li>📡 Host live events</li>
      <li>💰 Sell tickets and earn</li>
      <li>📊 Track analytics</li>
    </ul>

    <div style="margin: 20px 0;">
      <a href="${process.env.FRONTEND_URL}" 
         style="background: #ec4899; color: #fff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Go to Dashboard
      </a>
    </div>

    <p>If you have any questions, feel free to reach out.</p>

    <p>— The TickiSpot Team 💖</p>
  </div>
`;


exports.ticketPurchaseEmail = (name, eventTitle, quantity) => `
  <div style="font-family: Arial; padding: 20px;">
    <h2>🎟️ Ticket Confirmed</h2>

    <p>Hi ${name},</p>

    <p>Your ticket for <strong>${eventTitle}</strong> is confirmed.</p>

    <p><strong>Quantity:</strong> ${quantity}</p>

    <h3>Your QR Code:</h3>

    <p>See attachment or scan below:</p>

    <img src="cid:ticketqr" width="200" />

    <p>Present this at entry.</p>
  </div>
`;

exports.organizerTicketAlertEmail = (organizerName, eventTitle, buyerName, quantity) => `
  <div style="font-family: Arial; padding: 20px;">
    <h2>🎉 New Ticket Purchase</h2>

    <p>Hi ${organizerName},</p>

    <p>
      <strong>${buyerName}</strong> just purchased tickets for your event:
    </p>

    <h3>${eventTitle}</h3>

    <p>
      Quantity: <strong>${quantity}</strong>
    </p>

    <hr/>
    <small>TickiSpot System Notification</small>
  </div>
`;

exports.billingSuccessEmail = (name, plan, amount, interval, reference) => `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:10px;">
    
    <h2 style="color:#16a34a;">🎉 Payment Successful!</h2>
    
    <p>Hi <strong>${name}</strong>,</p>
    
    <p>Your subscription has been successfully activated.</p>

    <div style="background:#f9fafb; padding:15px; border-radius:8px; margin:20px 0;">
      <p><strong>Plan:</strong> ${plan.toUpperCase()}</p>
      <p><strong>Billing:</strong> ${interval}</p>
      <p><strong>Amount Paid:</strong> ₦${amount}</p>
      <p><strong>Reference:</strong> ${reference}</p>
    </div>

    <p>You now have access to premium features on <strong>TickiSpot</strong>.</p>

    <p>Thank you for trusting us 🚀</p>

    <p style="margin-top:20px;">
      — <strong>TickiSpot Team</strong>
    </p>
  </div>
`;

