const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["ticket", "withdrawal"],   // ✅ allow ticket
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],  // ✅ allow success
      default: "pending",
    },

    reference: {
      type: String,
    },

    metadata: {
      eventId: mongoose.Schema.Types.ObjectId,
      ticketId: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
