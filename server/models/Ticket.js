
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
    required: true,
    trim: true,
    default: "Free",
  },
  price: {
    type: Number,
    default: 0,
    min: 0,
  },
  amount: {
    type: Number,
    default: 0,
    min: 0,
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0,
  },
  paymentStatus: {
    type: String,
    enum: ["paid", "free"],
    default: "free",
  },
  isFree: {
    type: Boolean,
    default: false,
  },
  reference: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  qrCode: {
    type: String,
  },
  used: {
    type: Boolean,
    default: false,
  },
  usedAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["active", "checked-in", "refunded", "cancelled"],
    default: "active",
  },
  purchasedAt: {
    type: Date,
    default: Date.now,
  },
});

ticketSchema.pre("validate", function normalizeTicketForValidation(next) {
  if (this.isFree) {
    this.price = 0;
    this.amount = 0;
    this.amountPaid = 0;
    this.paymentStatus = "free";
    this.ticketType = String(this.ticketType || "Free").trim() || "Free";
  } else {
    this.paymentStatus = "paid";
  }

  next();
});

module.exports = mongoose.model("Ticket", ticketSchema);