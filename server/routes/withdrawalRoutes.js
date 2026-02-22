const express = require("express");
const router = express.Router();
const {
  getOrganizerTransactions,
} = require("../controllers/withdrawalController");

const { authMiddleware } = require("../middleware/authMiddleware");

const { createRecipient, initiateTransfer } = require("../utils/paystack");

router.patch("/admin/withdrawals/:id", adminMiddleware, async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id)
    .populate("organizer");

  if (!withdrawal) {
    return res.status(404).json({ message: "Withdrawal not found" });
  }

  if (withdrawal.status !== "pending") {
    return res.status(400).json({ message: "Already processed" });
  }

  const organizer = withdrawal.organizer;

  if (organizer.availableBalance < withdrawal.amount) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  try {
    // 1️⃣ Create transfer recipient
    const recipientCode = await createRecipient(
      withdrawal.bankDetails
    );

    // 2️⃣ Initiate transfer
    const transfer = await initiateTransfer(
      withdrawal.amount,
      recipientCode,
      `withdraw_${withdrawal._id}`
    );

    // Mark as processing (NOT completed yet)
    withdrawal.status = "approved";
    withdrawal.paystackReference = transfer.reference;
    withdrawal.processedBy = req.user.id;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    res.json({ message: "Transfer initiated successfully" });

  } catch (error) {
    console.error(error.response?.data || error.message);

    withdrawal.status = "rejected";
    await withdrawal.save();

    res.status(500).json({ message: "Transfer failed" });
  }
});

router.post("/organizer/withdraw", authMiddleware, async (req, res) => {
  const { amount, paymentMethod, bankDetails } = req.body;

  const user = await User.findById(req.user.id);

  if (amount > user.availableBalance) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  const withdrawal = await Withdrawal.create({
    organizer: user._id,
    amount,
    paymentMethod,
    bankDetails,
  });

  // Create pending transaction
  await Transaction.create({
    organizer: user._id,
    type: "withdrawal",
    amount,
    status: "pending",
    referenceId: withdrawal._id,
  });

  res.json({ message: "Withdrawal request submitted" });
});


router.get("/transactions", authMiddleware, getOrganizerTransactions);

module.exports = router;