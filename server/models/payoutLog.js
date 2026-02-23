

const payoutLogSchema = new mongoose.Schema({
  withdrawal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Withdrawal",
  },
  action: String,
  message: String,
}, { timestamps: true });