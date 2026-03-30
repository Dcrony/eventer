const express = require("express");
const router = express.Router();

const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const {
  requestWithdrawal,
  getOrganizerTransactions,
} = require("../controllers/withdrawalController");

const {
  authMiddleware,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const { createRecipient, initiateTransfer } = require("../utils/paystack");

/*
|--------------------------------------------------------------------------
| ORGANIZER ROUTES
|--------------------------------------------------------------------------
*/

router.post(
  "/organizer/withdraw",
  authMiddleware,
  authorizeRoles("organizer", "admin"),
  requestWithdrawal,
);

router.get("/organizer/transactions", authMiddleware, getOrganizerTransactions);

/*
|--------------------------------------------------------------------------
| ADMIN APPROVE & INITIATE TRANSFER
|--------------------------------------------------------------------------
*/

router.patch(
  "/admin/withdrawals/:id",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const withdrawal = await Withdrawal.findById(req.params.id).populate(
        "organizer"
      );

      if (!withdrawal) {
        return res.status(404).json({ message: "Withdrawal not found" });
      }

      if (withdrawal.status !== "pending") {
        return res.status(400).json({ message: "Already processed" });
      }

      // ✅ HANDLE REJECTION
      if (status === "rejected") {
        withdrawal.status = "rejected";
        withdrawal.processedBy = req.user.id;
        withdrawal.processedAt = new Date();
        await withdrawal.save();

        return res.json({ message: "Withdrawal rejected" });
      }

      // ✅ HANDLE APPROVAL (INITIATE TRANSFER)
      if (status === "approved") {
        const organizer = withdrawal.organizer;

        if (organizer.availableBalance < withdrawal.amount) {
          return res.status(400).json({
            message: "Insufficient balance",
          });
        }

        const recipientCode = await createRecipient(
          withdrawal.bankDetails
        );

        const transfer = await initiateTransfer(
          withdrawal.netAmount * 100,
          recipientCode,
          `withdraw_${withdrawal._id}`
        );

        withdrawal.status = "processing";
        withdrawal.paystackReference = transfer.reference;
        withdrawal.processedBy = req.user.id;
        withdrawal.processedAt = new Date();

        await withdrawal.save();

        return res.json({
          message: "Transfer initiated successfully",
        });
      }

      res.status(400).json({ message: "Invalid status update" });
    } catch (error) {
      console.error(error.response?.data || error.message);

      await Withdrawal.findByIdAndUpdate(req.params.id, {
        status: "failed",
        failureReason: error.message,
      });

      res.status(500).json({ message: "Transfer failed" });
    }
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN GET WITHDRAWALS (Filter + Search)
|--------------------------------------------------------------------------
*/

router.get(
  "/admin/withdrawals",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
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
          w.organizer?.username?.toLowerCase().includes(search.toLowerCase()),
        );
      }

      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  },
);

/*
|--------------------------------------------------------------------------
| ADMIN MONTHLY TREND
|--------------------------------------------------------------------------
*/

router.get(
  "/admin/withdrawals/monthly",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const monthly = await Withdrawal.aggregate([
        {
          $match: { status: "completed" },
        },
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
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN ANALYTICS
|--------------------------------------------------------------------------
*/

router.get(
  "/admin/withdrawals/analytics",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
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
  },
);

const axios = require("axios");

router.get("/banks", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.paystack.co/bank?country=nigeria",
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    res.json(response.data.data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch banks" });
  }
});



module.exports = router;
