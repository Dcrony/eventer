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