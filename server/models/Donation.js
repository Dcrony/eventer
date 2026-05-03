const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    amount: Number,
    message: String,
    reference: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);