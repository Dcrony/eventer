require('dotenv').config();
const axios = require('axios');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');


const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

console.log("PAYSTACK KEY:", PAYSTACK_SECRET);

//Initiate Payment
exports.initiatePayment = async (req, res) => {
  const { email, amount } = req.body;

  try {
    const response = await axios.post(
  'https://api.paystack.co/transaction/initialize',
  {
    email,
    amount: amount * 100,
    callback_url: process.env.PAYSTACK_CALLBACK,
    metadata: {
      eventId: req.body.metadata.eventId,
      userId: req.user.id,
      quantity: req.body.metadata.quantity,
    }
  },
  {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
  }
);


    res.status(200).json({ url: response.data.data.authorization_url });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: 'Payment initialization failed' });
  }
};


// Verify Payment

exports.verifyPayment = async (req, res) => {
  const { reference } = req.query;

  try {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
      },
    });

    const data = response.data.data;

    // Destructure metadata
    const { eventId, userId, quantity } = data.metadata;

    if (data.status === 'success') {
      // Check if ticket already exists
      const existingTicket = await Ticket.findOne({ reference: data.reference });
      if (existingTicket) return res.redirect('http://localhost:5173/success'); // frontend success page

      // Get event
      const event = await Event.findById(eventId);
      if (!event || event.totalTickets < quantity) {
        return res.status(400).json({ message: 'Invalid event or not enough tickets' });
      }

      // Create ticket
      const ticket = new Ticket({
        event: eventId,
        user: userId,
        quantity,
        reference: data.reference,
      });

      await ticket.save();

      // Reduce available tickets
      event.totalTickets -= quantity;
      await event.save();

      return res.redirect('http://localhost:5173/success');
    } else {
      return res.redirect('http://localhost:5173/failed');
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).send('Verification failed');
  }
};
