const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    fee: {
      type: Number,
      default: 0,
    },

    netAmount: {
      type: Number,
    },

    paymentMethod: {
      type: String,
      enum: ["bank", "paystack", "flutterwave"],
      required: true,
    },

    bankDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      bankCode: String,
    },

    paystackRecipientCode: String,
    transferReference: String,

    status: {
  type: String,
  enum: [
    "pending",
    "approved",
    "processing",
    "completed",
    "rejected",
    "failed"
  ],
  default: "pending",
},

    paystackReference: String,

    failureReason: String,

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    processedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);