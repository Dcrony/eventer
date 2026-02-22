const transactionSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["ticket_sale", "withdrawal"],
      required: true,
    },
    amount: Number,
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "type", 
    },
  },
  { timestamps: true }
);