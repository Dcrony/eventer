const mongoose = require("mongoose");

const payoutAccountSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One payout account per organizer
    },

    // Paystack recipient code for transfers
    paystackRecipientCode: {
      type: String,
      required: true,
    },

    // Bank account details
    bankDetails: {
      bankName: {
        type: String,
        required: true,
      },
      accountNumber: {
        type: String,
        required: true,
      },
      accountName: {
        type: String,
        required: true,
      },
      bankCode: {
        type: String,
        required: true,
      },
    },

    // Verification status
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    // Last verification attempt
    lastVerifiedAt: Date,

    // Failure tracking
    verificationAttempts: {
      type: Number,
      default: 0,
    },

    failureReason: String,
  },
  { timestamps: true }
);

// Index for efficient lookups
payoutAccountSchema.index({ paystackRecipientCode: 1 });

module.exports = mongoose.model("PayoutAccount", payoutAccountSchema);