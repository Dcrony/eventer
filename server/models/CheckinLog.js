const mongoose = require("mongoose");

const CheckinLogSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket" },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["checked-in", "duplicate", "failed", "manual"],
      default: "checked-in",
    },
    name: { type: String },
    ticketType: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CheckinLog", CheckinLogSchema);
