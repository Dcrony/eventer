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

    // Create withdrawal
    const withdrawal = await Withdrawal.create({
      organizer: organizerId,
      amount,
      fee,
      netAmount,
      paymentMethod,
      bankDetails,
      status: "pending",
    });

    // Do not deduct balance yet - wait for admin approval

    // Log transaction
    await Transaction.create({
      organizer: organizerId,
      type: "withdrawal",
      amount,
      fee,
      status: "pending",
      referenceId: withdrawal._id,
    });

    console.log(`💸 Withdrawal requested: ${amount} by ${organizer.username}`);

    res.status(200).json({
      message: "Withdrawal request submitted. Awaiting admin approval.",
      withdrawal,
    });

  } catch (error) {
    console.error("Withdrawal Request Error:", error);
    res.status(500).json({ message: "Withdrawal failed" });
  }
};

const { createRecipient, initiateTransfer } = require("../utils/paystack");

exports.adminUpdateWithdrawal = async (req, res) => {
  try {
    const { status } = req.body;
    const withdrawalId = req.params.id;

    const withdrawal = await Withdrawal.findById(withdrawalId).populate("organizer");

    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({ message: "Withdrawal already processed" });
    }

    const organizer = withdrawal.organizer;

    // ✅ HANDLE REJECTION
    if (status === "rejected") {
      withdrawal.status = "rejected";
      withdrawal.processedBy = req.user.id;
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      // REFUND BALANCE
      organizer.availableBalance += withdrawal.amount;
      await organizer.save();

      // Update transaction
      await Transaction.findOneAndUpdate(
        { referenceId: withdrawal._id, type: "withdrawal" },
        { status: "failed" }
      );

      console.log(`❌ Withdrawal rejected and refunded: ${withdrawal.amount} to ${organizer.username}`);
      return res.json({ message: "Withdrawal rejected and balance refunded" });
    }

    // ✅ HANDLE APPROVAL (INITIATE TRANSFER)
    if (status === "approved") {
      // Check minimum withdrawal
      const MIN_WITHDRAWAL = 1000; // NGN
      if (withdrawal.amount < MIN_WITHDRAWAL) {
        return res.status(400).json({ message: `Minimum withdrawal amount is ₦${MIN_WITHDRAWAL}` });
      }

      // Deduct balance now
      if (organizer.availableBalance < withdrawal.amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      organizer.availableBalance -= withdrawal.amount;
      await organizer.save();

      try {
        const recipientCode = await createRecipient(withdrawal.bankDetails);

        const transfer = await initiateTransfer(
          Math.round(withdrawal.netAmount * 100), // Paystack expects kobo
          recipientCode,
          `withdraw_${withdrawal._id}`
        );

        withdrawal.status = "processing";
        withdrawal.paystackRecipientCode = recipientCode;
        withdrawal.transferReference = transfer.reference;
        withdrawal.paystackReference = transfer.reference;
        withdrawal.processedBy = req.user.id;
        withdrawal.processedAt = new Date();
        await withdrawal.save();

        // Update transaction
        await Transaction.findOneAndUpdate(
          { referenceId: withdrawal._id, type: "withdrawal" },
          { status: "processing" }
        );

        console.log(`🚀 Withdrawal approved and transfer initiated: ${withdrawal._id}`);
        return res.json({ message: "Transfer initiated successfully", withdrawal });
      } catch (paystackError) {
        console.error("Paystack Transfer Error:", paystackError.response?.data || paystackError.message);
        
        // Refund balance on failure
        organizer.availableBalance += withdrawal.amount;
        await organizer.save();

        withdrawal.status = "failed";
        withdrawal.failureReason = paystackError.response?.data?.message || paystackError.message;
        await withdrawal.save();

        return res.status(500).json({ message: "Paystack transfer failed", error: withdrawal.failureReason });
      }
    }

    res.status(400).json({ message: "Invalid status update" });
  } catch (error) {
    console.error("Admin Withdrawal Update Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAdminWithdrawals = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    let withdrawals = await Withdrawal.find(filter)
      .populate("organizer", "username email")
      .sort({ createdAt: -1 });

    if (search) {
      withdrawals = withdrawals.filter((w) =>
        w.organizer?.username?.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch withdrawals" });
  }
};

exports.getWithdrawalAnalytics = async (req, res) => {
  try {
    const totalPaid = await Withdrawal.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalPending = await Withdrawal.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalFees = await Withdrawal.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$fee" } } },
    ]);

    res.json({
      totalPaid: totalPaid[0]?.total || 0,
      totalPending: totalPending[0]?.total || 0,
      totalPlatformFees: totalFees[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Analytics failed" });
  }
};

exports.getMonthlyWithdrawalTrend = async (req, res) => {
  try {
    const monthly = await Withdrawal.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const formatted = monthly.map((m) => ({
      month: `${m._id.month}/${m._id.year}`,
      total: m.total,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Monthly analytics failed" });
  }
};

exports.getOrganizerTransactions = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const organizerId = req.user.id;

    const transactions = await Transaction.find({ organizer: organizerId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(transactions);
  } catch (error) {
    console.error("Transaction fetch error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};