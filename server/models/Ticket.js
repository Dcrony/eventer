const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
   ticketType: {               
    type: String,
    required: true,           // e.g. "Regular", "VIP"
  },
  price: { // Price per ticket
    type: Number,
    required: true,
  },
  amount: { // Total amount paid
    type: Number,
    required: true,
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  paymentStatus: {
    type: String,
    enum: ["paid", "free"],
    default: "paid",
  },
  isFree: {
    type: Boolean,
    default: false,
  },
  reference: {
    type: String,
    required: true,
    unique: true,
  },
  qrCode: {
    type: String,
  },
  used: { 
    type: Boolean, 
    default: false 
  },
  usedAt: { 
    type: Date 
  },
  purchasedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Ticket", ticketSchema);
