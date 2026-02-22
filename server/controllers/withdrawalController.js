require("dotenv").config();
const axios = require("axios");
const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

exports.requestWithdrawal = async (req, res) => {
  const { amount, bankName, accountNumber, accountName } = req.body;
  const organizerId = req.user.id; // assuming auth middleware

  try {
    const organizer = await User.findById(organizerId);

    if (!organizer)
      return res.status(404).json({ message: "Organizer not found" });

    if (organizer.balance < amount)
      return res.status(400).json({ message: "Insufficient balance" });

    // Generate unique reference
    const reference = `WD-${Date.now()}`;

    // Create withdrawal record
    const withdrawal = await Withdrawal.create({
      organizer: organizerId,
      amount,
      bankName,
      accountNumber,
      accountName,
      reference,
      status: "pending",
    });

    // Log transaction
    await Transaction.create({
      organizer: organizerId,
      type: "withdrawal",
      amount,
      status: "pending",
      reference,
    });

    // OPTIONAL: Paystack Transfer API (if you want automatic payout)
    /*
    await axios.post(
      "https://api.paystack.co/transfer",
      {
        source: "balance",
        amount: amount * 100,
        recipient: "RECIPIENT_CODE"
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`
        }
      }
    );
    */

    // Deduct balance immediately (or wait until success webhook)
    organizer.balance -= amount;
    await organizer.save();

    res.status(200).json({ message: "Withdrawal request submitted" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Withdrawal failed" });
  }
};

exports.getOrganizerTransactions = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const transactions = await Transaction.find({
      organizer: organizerId,
    }).sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};