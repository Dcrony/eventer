// utils/emailTemplates.js
const ticketConfirmationTemplate = (user, event, ticketDetails, qrBuffer) => {
  return {
    subject: `🎟️ Your Ticket for ${event.title} is Confirmed!`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ec4899, #f43f5e); padding: 30px; text-align: center; border-radius: 20px 20px 0 0;">
          <h1 style="color: white; margin: 0;">🎉 Payment Successful!</h1>
        </div>
        <div style="padding: 30px; background: #ffffff; border-radius: 0 0 20px 20px;">
          <h2>Hi ${user.name || user.username}!</h2>
          <p>Your ticket has been confirmed. Here are the details:</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p><strong>Event:</strong> ${event.title}</p>
            <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString()}</p>
            <p><strong>Ticket Type:</strong> ${ticketDetails.type}</p>
            <p><strong>Quantity:</strong> ${ticketDetails.quantity}</p>
            <p><strong>Total Paid:</strong> ₦${ticketDetails.total.toLocaleString()}</p>
          </div>
          
          <p>Show the QR code below at the entrance:</p>
          <img src="cid:qr-code" style="width: 200px; height: 200px; display: block; margin: 20px auto;" />
          
          <a href="${process.env.FRONTEND_URL}/my-tickets" style="display: inline-block; padding: 12px 24px; background: #ec4899; color: white; text-decoration: none; border-radius: 30px; margin-top: 20px;">View My Tickets</a>
        </div>
      </div>
    `
  };
};

module.exports = { ticketConfirmationTemplate };