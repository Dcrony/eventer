const mongoose = require("mongoose");

/**
 * Transaction — the immutable ledger for every money movement on TickiSpot.
 *
 * type:
 *   "ticket"     — buyer purchased ticket(s); gross amount recorded, fee deducted
 *   "withdrawal" — organizer requested a payout to their bank
 *   "refund"     — admin refunded a payout back into escrow
 *
 * Flow:
 *   ticket sold  → Transaction(ticket, pending)  + Payout(pending)
 *   event ends   → Payout released → Transaction(ticket) status → success
 *                  organizer.availableBalance increases
 *   withdrawal   → Transaction(withdrawal, pending) + Withdrawal(pending)
 *   admin approves withdrawal → Paystack transfer → Transaction status → success
 */
const transactionSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["ticket", "withdrawal", "refund"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    /** Platform commission for ticket sales; processing fee for withdrawals. */
    fee: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
      index: true,
    },

    /** Paystack or internal reference */
    reference: {
      type: String,
      index: true,
      sparse: true,
    },

    /** Points to the Withdrawal document for withdrawal-type transactions */
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Withdrawal",
    },

    metadata: {
      eventId:    { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
      ticketId:   { type: mongoose.Schema.Types.ObjectId },
      payoutId:   { type: mongoose.Schema.Types.ObjectId, ref: "Payout" },
      withdrawalId: { type: mongoose.Schema.Types.ObjectId, ref: "Withdrawal" },
    },
  },
  { timestamps: true }
);

transactionSchema.index({ organizer: 1, createdAt: -1 });
transactionSchema.index({ "metadata.payoutId": 1 });
transactionSchema.index({ "metadata.withdrawalId": 1 });

module.exports = mongoose.model("Transaction", transactionSchema);