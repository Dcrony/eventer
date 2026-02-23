require("dotenv").config();
const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const WITHDRAWAL_FEE_PERCENT = 2; // change anytime

/*
|--------------------------------------------------------------------------
| ORGANIZER REQUEST WITHDRAWAL
|--------------------------------------------------------------------------
*/
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethod, bankDetails } = req.body;
    const organizerId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const organizer = await User.findById(organizerId);

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    if (amount > organizer.availableBalance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Calculate fee
    const fee = (amount * WITHDRAWAL_FEE_PERCENT) / 100;
    const netAmount = amount - fee;

    // Create withdrawal (DO NOT deduct balance yet)
    const withdrawal = await Withdrawal.create({
      organizer: organizerId,
      amount,
      fee,
      netAmount,
      paymentMethod,
      bankDetails,
      status: "pending",
    });

    // Log transaction
    await Transaction.create({
      organizer: organizerId,
      type: "withdrawal",
      amount,
      fee,
      status: "pending",
      referenceId: withdrawal._id,
    });

    res.status(200).json({
      message: "Withdrawal request submitted",
      withdrawal,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Withdrawal failed" });
  }
};


/*
|--------------------------------------------------------------------------
| ORGANIZER VIEW TRANSACTIONS
|--------------------------------------------------------------------------
*/
exports.getOrganizerTransactions = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const transactions = await Transaction.find({
      organizer: organizerId,
    })
      .populate("referenceId")
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};