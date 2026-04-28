const mongoose = require("mongoose");

const billingHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ["free", "pro", "business"],
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    interval: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled"],
      default: "pending",
    },
    reference: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    paystackCustomerId: {
      type: String,
      default: "",
    },
    paystackSubscriptionCode: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BillingHistory", billingHistorySchema);
