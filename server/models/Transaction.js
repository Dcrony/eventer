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
      enum: ["ticket", "withdrawal"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    reference: {
      type: String,
    },

    metadata: {
      type: Object,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);