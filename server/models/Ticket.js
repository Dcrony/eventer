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
  qrCode: {
    type: String,
  }, // store QR code file name
  purchasedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Ticket", ticketSchema);
