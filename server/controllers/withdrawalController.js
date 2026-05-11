require("dotenv").config();
const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const { capOrganizerAvailableBalance } = require("../utils/organizerBalance");
const { createRecipient, initiateTransfer } = require("../utils/paystack");
const { createNotification } = require("../services/notificationService");

const WITHDRAWAL_FEE_PERCENT = 2;

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePagination = (page, limit, defaultLimit = 20) => {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.max(Number.parseInt(limit, 10) || defaultLimit, 1);
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.max(Math.ceil(total / limit), 1),
});

const buildDateRange = (startDate, endDate) => {
  if (!startDate && !endDate) return null;
  const range = {};

  if (startDate) {
    const start = new Date(startDate);
    if (!Number.isNaN(start.getTime())) {
      range.$gte = start;
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
  }

  return Object.keys(range).length ? range : null;
};

async function logAdminActivity(req, action, targetId, details) {
  try {
    await ActivityLog.create({
      adminId: req.user._id,
      action,
      targetType: "Other",
      targetId,
      details,
      ipAddress: req.ip || null,
    });
  } catch (error) {
    console.error("Failed to log withdrawal admin activity:", error);
  }
}

exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    const organizerId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const organizer = await User.findById(organizerId).populate('payoutAccount');
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // Check if payout account is connected
    if (!organizer.payoutAccount) {
      return res.status(400).json({
        message: "No payout account connected. Please connect a bank account first.",
        code: "PAYOUT_ACCOUNT_REQUIRED"
      });
    }

    // Check if payout account is active
    if (organizer.payoutAccount.status !== "active") {
      return res.status(400).json({
        message: "Payout account is not active. Please update your account details.",
        code: "PAYOUT_ACCOUNT_INACTIVE"
      });
    }

    const maxWithdrawable = await capOrganizerAvailableBalance(
      organizerId,
      organizer.availableBalance,
    );

    if (amount > maxWithdrawable) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const fee = (amount * WITHDRAWAL_FEE_PERCENT) / 100;
    const netAmount = amount - fee;

    // Create withdrawal with payout account details
    const withdrawal = await Withdrawal.create({
      organizer: organizerId,
      amount,
      fee,
      netAmount,
      paymentMethod: "bank",
      bankDetails: organizer.payoutAccount.bankDetails,
      status: "pending",
    });

    await Transaction.create({
      organizer: organizerId,
      type: "withdrawal",
      amount,
      fee,
      status: "pending",
      referenceId: withdrawal._id,
      metadata: {
        withdrawalId: withdrawal._id,
        payoutAccountId: organizer.payoutAccount._id,
      },
    });

    // Send notification
    await createNotification(req.app, {
      userId: organizerId,
      type: "withdrawal_requested",
      message: `Withdrawal request for ₦${amount.toLocaleString()} submitted successfully`,
      actionUrl: "/transactions",
      entityId: withdrawal._id,
      entityType: "withdrawal",
    });

    return res.status(200).json({
      message: "Withdrawal request submitted successfully",
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        fee: withdrawal.fee,
        netAmount: withdrawal.netAmount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
      },
    });
  } catch (error) {
    console.error("Withdrawal Request Error:", error);
    return res.status(500).json({ message: "Withdrawal failed" });
  }
};

exports.adminUpdateWithdrawal = async (req, res) => {
  try {
    const requestedStatus = String(req.body.status || "").trim().toLowerCase();
    const withdrawalId = req.params.id;

    if (!["approved", "rejected"].includes(requestedStatus)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    const withdrawal = await Withdrawal.findById(withdrawalId).populate("organizer");
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (!["pending", "approved"].includes(withdrawal.status)) {
      return res.status(400).json({ message: "Withdrawal already processed" });
    }

    const organizer = withdrawal.organizer;

    if (requestedStatus === "rejected") {
      withdrawal.status = "rejected";
      withdrawal.processedBy = req.user.id;
      withdrawal.processedAt = new Date();
      withdrawal.failureReason = String(req.body.reason || "Rejected by admin");
      await withdrawal.save();

      await Transaction.findOneAndUpdate(
        { referenceId: withdrawal._id, type: "withdrawal" },
        { status: "failed" },
      );

      await logAdminActivity(
        req,
        "WITHDRAWAL_REJECTED",
        withdrawal._id,
        `${organizer?.email || organizer?.username || "Organizer"} withdrawal rejected`,
      );

      return res.json({ message: "Withdrawal request rejected", withdrawal });
    }

    const MIN_WITHDRAWAL = Number(process.env.MIN_WITHDRAWAL_NGN || 1000);
    if (withdrawal.amount < MIN_WITHDRAWAL) {
      return res.status(400).json({ message: `Minimum withdrawal amount is NGN ${MIN_WITHDRAWAL}` });
    }

    const maxWithdrawable = await capOrganizerAvailableBalance(
      organizer._id,
      organizer.availableBalance,
    );

    if (withdrawal.amount > maxWithdrawable) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    organizer.availableBalance = maxWithdrawable - withdrawal.amount;
    await organizer.save();

    try {
      // Get the payout account to use existing recipient code
      const PayoutAccount = require("../models/PayoutAccount");
      const payoutAccount = await PayoutAccount.findOne({ organizer: organizer._id });

      if (!payoutAccount || !payoutAccount.paystackRecipientCode) {
        throw new Error("No valid payout account found for this organizer");
      }

      const transfer = await initiateTransfer(
        Math.round(withdrawal.netAmount * 100),
        payoutAccount.paystackRecipientCode,
        `withdraw_${withdrawal._id}`,
      );

      withdrawal.status = "processing";
      withdrawal.paystackRecipientCode = payoutAccount.paystackRecipientCode;
      withdrawal.transferReference = transfer.reference;
      withdrawal.paystackReference = transfer.reference;
      withdrawal.processedBy = req.user.id;
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      await Transaction.findOneAndUpdate(
        { referenceId: withdrawal._id, type: "withdrawal" },
        { status: "pending", reference: transfer.reference },
      );

      // Send notification to organizer
      await createNotification(req.app, {
        userId: organizer._id,
        type: "withdrawal_processing",
        message: `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} is now being processed`,
        actionUrl: "/transactions",
        entityId: withdrawal._id,
        entityType: "withdrawal",
      });

      await logAdminActivity(
        req,
        "WITHDRAWAL_APPROVED",
        withdrawal._id,
        `${organizer?.email || organizer?.username || "Organizer"} withdrawal approved`,
      );

      return res.json({ message: "Transfer initiated successfully", withdrawal });
    } catch (paystackError) {
      organizer.availableBalance += withdrawal.amount;
      await organizer.save();

      withdrawal.status = "failed";
      withdrawal.failureReason =
        paystackError.response?.data?.message || paystackError.message || "Transfer failed";
      withdrawal.processedBy = req.user.id;
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      await Transaction.findOneAndUpdate(
        { referenceId: withdrawal._id, type: "withdrawal" },
        { status: "failed" },
      );

      console.error("Paystack Transfer Error:", paystackError.response?.data || paystackError.message);
      return res.status(500).json({ message: "Paystack transfer failed", error: withdrawal.failureReason });
    }
  } catch (error) {
    console.error("Admin Withdrawal Update Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getAdminWithdrawals = async (req, res) => {
  try {
    const { status, search, sort = "latest" } = req.query;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    const dateRange = buildDateRange(req.query.startDate, req.query.endDate);
    if (dateRange) {
      filter.createdAt = dateRange;
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      const organizers = await User.find({
        $or: [{ username: regex }, { email: regex }, { name: regex }],
      }).select("_id");
      filter.organizer = { $in: organizers.map((user) => user._id) };

      if (!organizers.length) {
        return res.json({
          success: true,
          withdrawals: [],
          summary: {
            totalRequested: 0,
            totalCompleted: 0,
            totalPending: 0,
            totalPlatformFees: 0,
          },
          pagination: buildPagination(page, limit, 0),
        });
      }
    }

    const sortOption =
      sort === "oldest"
        ? { createdAt: 1 }
        : sort === "largest"
          ? { amount: -1, createdAt: -1 }
          : { createdAt: -1 };

    const [withdrawals, total, summaryAgg] = await Promise.all([
      Withdrawal.find(filter)
        .populate("organizer", "name username email")
        .populate("processedBy", "name username email")
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Withdrawal.countDocuments(filter),
      Withdrawal.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRequested: { $sum: "$amount" },
            totalCompleted: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0],
              },
            },
            totalPending: {
              $sum: {
                $cond: [{ $in: ["$status", ["pending", "approved", "processing"]] }, "$amount", 0],
              },
            },
            totalPlatformFees: { $sum: "$fee" },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      withdrawals,
      summary:
        summaryAgg[0] || {
          totalRequested: 0,
          totalCompleted: 0,
          totalPending: 0,
          totalPlatformFees: 0,
        },
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    console.error("Failed to fetch withdrawals:", error);
    return res.status(500).json({ message: "Failed to fetch withdrawals" });
  }
};

exports.getWithdrawalAnalytics = async (req, res) => {
  try {
    const [summary, statusBreakdown] = await Promise.all([
      Withdrawal.aggregate([
        {
          $group: {
            _id: null,
            totalPaid: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0],
              },
            },
            totalPending: {
              $sum: {
                $cond: [{ $in: ["$status", ["pending", "approved", "processing"]] }, "$amount", 0],
              },
            },
            totalPlatformFees: { $sum: "$fee" },
          },
        },
      ]),
      Withdrawal.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    return res.json({
      ...(summary[0] || {
        totalPaid: 0,
        totalPending: 0,
        totalPlatformFees: 0,
      }),
      statusBreakdown,
    });
  } catch (error) {
    return res.status(500).json({ message: "Analytics failed" });
  }
};

exports.getMonthlyWithdrawalTrend = async (req, res) => {
  try {
    const monthly = await Withdrawal.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$amount" },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    const formatted = monthly.map((item) => ({
      month: `${item._id.month}/${item._id.year}`,
      total: item.total,
      completed: item.completed,
    }));

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ message: "Monthly analytics failed" });
  }
};

exports.exportAdminWithdrawals = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status;
    }

    const dateRange = buildDateRange(req.query.startDate, req.query.endDate);
    if (dateRange) {
      filter.createdAt = dateRange;
    }

    if (req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), "i");
      const organizers = await User.find({
        $or: [{ username: regex }, { email: regex }, { name: regex }],
      }).select("_id");
      filter.organizer = { $in: organizers.map((user) => user._id) };
    }

    const withdrawals = await Withdrawal.find(filter)
      .populate("organizer", "name username email")
      .sort({ createdAt: -1 })
      .lean();

    const csvRows = [
      ["Organizer", "Email", "Amount", "Fee", "Net Amount", "Status", "Reference", "Created At"],
      ...withdrawals.map((item) => [
        item.organizer?.name || item.organizer?.username || "",
        item.organizer?.email || "",
        item.amount || 0,
        item.fee || 0,
        item.netAmount || 0,
        item.status || "",
        item.paystackReference || item.transferReference || "",
        item.createdAt ? new Date(item.createdAt).toISOString() : "",
      ]),
    ];

    const csv = csvRows
      .map((row) =>
        row
          .map((value) => {
            const safe = String(value ?? "");
            return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
          })
          .join(","),
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="withdrawals.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    console.error("Withdrawal export failed:", error);
    return res.status(500).json({ message: "Failed to export withdrawals" });
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
