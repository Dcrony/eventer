require("dotenv").config();

const Withdrawal   = require("../models/Withdrawal");
const Transaction  = require("../models/Transaction");
const User         = require("../models/User");
const OrganizerVerification = require("../models/OrganizerVerification");
const ActivityLog  = require("../models/ActivityLog");
const { capOrganizerAvailableBalance } = require("../utils/organizerBalance");
const { initiateTransfer }             = require("../utils/paystack");
const { createNotification }           = require("../services/notificationService");

const WITHDRAWAL_FEE_PERCENT = Number(process.env.WITHDRAWAL_FEE_PERCENT || 2);
const MIN_WITHDRAWAL         = Number(process.env.MIN_WITHDRAWAL_NGN || 1000);

const escapeRegex = (v = "") => String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePagination = (page, limit, defaultLimit = 20) => {
  const safePage  = Math.max(Number.parseInt(page,  10) || 1, 1);
  const safeLimit = Math.max(Number.parseInt(limit, 10) || defaultLimit, 1);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
};

const buildPagination = (page, limit, total) => ({
  page, limit, total,
  pages: Math.max(Math.ceil(total / limit), 1),
});

const buildDateRange = (startDate, endDate) => {
  if (!startDate && !endDate) return null;
  const range = {};
  if (startDate) { const s = new Date(startDate); if (!isNaN(s)) range.$gte = s; }
  if (endDate)   { const e = new Date(endDate);   if (!isNaN(e)) { e.setHours(23, 59, 59, 999); range.$lte = e; } }
  return Object.keys(range).length ? range : null;
};

const getVerificationStatus = async (userId) => {
  const v = await OrganizerVerification.findOne({ organizer: userId }).sort({ createdAt: -1 });
  return {
    status:          v?.status || "not_started",
    isVerified:      v?.status === "approved",
    rejectionReason: v?.rejectionReason || null,
  };
};

async function logAdminActivity(req, action, targetId, details) {
  try {
    await ActivityLog.create({
      adminId:    req.user._id,
      action,
      targetType: "Other",
      targetId,
      details,
      ipAddress:  req.ip || null,
    });
  } catch (e) {
    console.error("Failed to log admin activity:", e);
  }
}

// ─── Helper: mark withdrawal + transaction as completed ───────────────────────
// Centralised so both the sync Paystack response path AND the async
// webhook path call exactly the same logic — no duplication, no drift.

async function markWithdrawalCompleted(withdrawal, paystackReference, app = null) {
  withdrawal.status        = "completed";
  withdrawal.completedAt   = new Date();
  if (paystackReference) {
    withdrawal.paystackReference = paystackReference;
    withdrawal.transferReference = paystackReference;
  }
  await withdrawal.save();

  // Mark the mirrored Transaction as success
  await Transaction.findOneAndUpdate(
    { "metadata.withdrawalId": withdrawal._id, type: "withdrawal" },
    {
      $set: {
        status:    "success",
        reference: paystackReference || withdrawal.transferReference || null,
      },
    },
  );

  // Notify the organizer
  try {
    await createNotification(app, {
      userId:    withdrawal.organizer,
      type:      "withdrawal_completed",
      message:   `₦${withdrawal.netAmount.toLocaleString()} has been sent to your bank account.`,
      actionUrl: "/dashboard/transactions",
      entityId:  withdrawal._id,
      entityType:"withdrawal",
    });
  } catch (e) {
    console.warn("Notification failed (withdrawal_completed):", e.message);
  }
}

// ─── Helper: mark withdrawal + transaction as failed ─────────────────────────
async function markWithdrawalFailed(withdrawal, reason, app = null) {
  withdrawal.status        = "failed";
  withdrawal.failureReason = reason || "Transfer failed";
  await withdrawal.save();

  await Transaction.findOneAndUpdate(
    { "metadata.withdrawalId": withdrawal._id, type: "withdrawal" },
    { $set: { status: "failed" } },
  );

  // Refund the availableBalance since we already deducted it at approval time
  await User.findByIdAndUpdate(withdrawal.organizer, {
    $inc: { availableBalance: withdrawal.amount },
  });

  try {
    await createNotification(app, {
      userId:    withdrawal.organizer,
      type:      "withdrawal_failed",
      message:   `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} failed. Funds have been returned to your balance. Reason: ${withdrawal.failureReason}`,
      actionUrl: "/support",
      entityId:  withdrawal._id,
      entityType:"withdrawal",
    });
  } catch (e) {
    console.warn("Notification failed (withdrawal_failed):", e.message);
  }
}

// ─── Organizer: request withdrawal ───────────────────────────────────────────

exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    const organizerId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (amount < MIN_WITHDRAWAL) {
      return res.status(400).json({ message: `Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}` });
    }

    const vs = await getVerificationStatus(organizerId);
    if (!vs.isVerified) {
      return res.status(403).json({
        code:               "VERIFICATION_REQUIRED",
        message:            "Complete your organizer verification before withdrawing",
        verificationStatus: vs.status,
        rejectionReason:    vs.rejectionReason,
      });
    }

    try {
      const fraudService = require("../services/fraudService");
      const flagged = await fraudService.isOrganizerFlagged(organizerId);
      if (flagged) {
        return res.status(403).json({ code: "WITHDRAWAL_BLOCKED_FRAUD", message: "Withdrawals blocked due to account review" });
      }
    } catch (e) { console.warn("Fraud check failed (non-fatal):", e.message); }

    const organizer = await User.findById(organizerId).populate("payoutAccount");
    if (!organizer) return res.status(404).json({ message: "Organizer not found" });

    if (!organizer.payoutAccount) {
      return res.status(400).json({ code: "PAYOUT_ACCOUNT_REQUIRED", message: "Connect a bank account before withdrawing" });
    }
    if (organizer.payoutAccount.status !== "active") {
      return res.status(400).json({ code: "PAYOUT_ACCOUNT_INACTIVE", message: "Your payout account is not active" });
    }

    const maxWithdrawable = await capOrganizerAvailableBalance(organizerId, organizer.availableBalance);
    if (amount > maxWithdrawable) {
      return res.status(400).json({
        message:          "Insufficient available balance",
        availableBalance: maxWithdrawable,
        requestedAmount:  amount,
        hint:             "Funds are released after your event ends.",
      });
    }

    const fee       = Math.round((amount * WITHDRAWAL_FEE_PERCENT) / 100);
    const netAmount = amount - fee;

    const withdrawal = await Withdrawal.create({
      organizer:    organizerId,
      amount,
      fee,
      netAmount,
      paymentMethod: "bank",
      bankDetails:   organizer.payoutAccount.bankDetails,
      status:        "pending",
    });

    // Mirrored Transaction — stays "pending" until admin approves + Paystack confirms
    await Transaction.create({
      organizer:   organizerId,
      type:        "withdrawal",
      amount,
      fee,
      status:      "pending",
      referenceId: withdrawal._id,
      metadata:    { withdrawalId: withdrawal._id },
    });

    try {
      await createNotification(req.app, {
        userId:    organizerId,
        type:      "withdrawal_requested",
        message:   `Withdrawal of ₦${amount.toLocaleString()} submitted — awaiting admin review.`,
        actionUrl: "/dashboard/transactions",
        entityId:  withdrawal._id,
        entityType:"withdrawal",
      });
    } catch (e) { console.warn("Notification failed:", e.message); }

    return res.status(201).json({
      message: "Withdrawal request submitted",
      withdrawal: {
        id:        withdrawal._id,
        amount:    withdrawal.amount,
        fee:       withdrawal.fee,
        netAmount: withdrawal.netAmount,
        status:    withdrawal.status,
        createdAt: withdrawal.createdAt,
      },
    });
  } catch (error) {
    console.error("requestWithdrawal error:", error);
    return res.status(500).json({ message: "Withdrawal request failed" });
  }
};

// ─── Admin: approve or reject withdrawal ─────────────────────────────────────

exports.adminUpdateWithdrawal = async (req, res) => {
  try {
    const requestedStatus = String(req.body.status || "").trim().toLowerCase();
    const withdrawalId    = req.params.id;

    if (!["approved", "rejected"].includes(requestedStatus)) {
      return res.status(400).json({ message: "status must be 'approved' or 'rejected'" });
    }

    const withdrawal = await Withdrawal.findById(withdrawalId).populate("organizer");
    if (!withdrawal) return res.status(404).json({ message: "Withdrawal not found" });

    if (!["pending", "approved"].includes(withdrawal.status)) {
      return res.status(400).json({ message: `Cannot update a withdrawal in '${withdrawal.status}' state` });
    }

    const organizer = withdrawal.organizer;

    // ── Reject ───────────────────────────────────────────────────────────────
    if (requestedStatus === "rejected") {
      withdrawal.status        = "rejected";
      withdrawal.processedBy   = req.user.id;
      withdrawal.processedAt   = new Date();
      withdrawal.failureReason = String(req.body.reason || "Rejected by admin");
      await withdrawal.save();

      // Mark the mirrored Transaction as failed
      await Transaction.findOneAndUpdate(
        { "metadata.withdrawalId": withdrawal._id, type: "withdrawal" },
        { $set: { status: "failed" } },
      );

      // Funds were never deducted from availableBalance at request time —
      // they are only deducted at approval time, so no refund needed here.

      try {
        await createNotification(req.app, {
          userId:    organizer._id,
          type:      "withdrawal_failed",
          message:   `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} was rejected. Reason: ${withdrawal.failureReason}`,
          actionUrl: "/dashboard/transactions",
          entityId:  withdrawal._id,
          entityType:"withdrawal",
        });
      } catch (e) { console.warn("Notification failed:", e.message); }

      await logAdminActivity(req, "WITHDRAWAL_REJECTED", withdrawal._id,
        `${organizer?.email || organizer?.username} withdrawal rejected`);

      return res.json({ message: "Withdrawal rejected", withdrawal });
    }

    // ── Approve → initiate Paystack transfer ─────────────────────────────────
    if (withdrawal.amount < MIN_WITHDRAWAL) {
      return res.status(400).json({ message: `Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}` });
    }

    const maxWithdrawable = await capOrganizerAvailableBalance(organizer._id, organizer.availableBalance);
    if (withdrawal.amount > maxWithdrawable) {
      return res.status(400).json({ message: "Organizer has insufficient balance" });
    }

    // Deduct availableBalance now so the organizer can't double-spend
    organizer.availableBalance = maxWithdrawable - withdrawal.amount;
    await organizer.save();

    try {
      const PayoutAccount = require("../models/PayoutAccount");
      const payoutAccount = await PayoutAccount.findOne({ organizer: organizer._id });

      if (!payoutAccount?.paystackRecipientCode) {
        throw new Error("Organizer has no valid Paystack recipient code");
      }

      const transfer = await initiateTransfer(
        Math.round(withdrawal.netAmount * 100),   // Paystack expects kobo
        payoutAccount.paystackRecipientCode,
        `ts_withdrawal_${withdrawal._id}`,
      );

      // ── Paystack can return status "success" synchronously (e.g. test mode)
      // In that case we can complete the withdrawal right now without waiting
      // for the webhook.
      if (transfer.status === "success") {
        withdrawal.processedBy            = req.user.id;
        withdrawal.processedAt            = new Date();
        withdrawal.paystackRecipientCode  = payoutAccount.paystackRecipientCode;

        await markWithdrawalCompleted(withdrawal, transfer.reference, req.app);

        await logAdminActivity(req, "WITHDRAWAL_APPROVED", withdrawal._id,
          `${organizer?.email || organizer?.username} withdrawal approved + completed (sync) — ref: ${transfer.reference}`);

        return res.json({ message: "Transfer completed", withdrawal });
      }

      // ── Normal async path — webhook will fire later ───────────────────────
      withdrawal.status                 = "processing";
      withdrawal.paystackRecipientCode  = payoutAccount.paystackRecipientCode;
      withdrawal.transferReference      = transfer.reference;
      withdrawal.paystackReference      = transfer.reference;
      withdrawal.processedBy            = req.user.id;
      withdrawal.processedAt            = new Date();
      await withdrawal.save();

      // Update the mirrored Transaction with the Paystack reference so we can
      // reconcile later, but keep status "pending" until the webhook confirms.
      await Transaction.findOneAndUpdate(
        { "metadata.withdrawalId": withdrawal._id, type: "withdrawal" },
        { $set: { reference: transfer.reference } },
      );

      try {
        await createNotification(req.app, {
          userId:    organizer._id,
          type:      "withdrawal_processing",
          message:   `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} is being processed.`,
          actionUrl: "/dashboard/transactions",
          entityId:  withdrawal._id,
          entityType:"withdrawal",
        });
      } catch (e) { console.warn("Notification failed:", e.message); }

      await logAdminActivity(req, "WITHDRAWAL_APPROVED", withdrawal._id,
        `${organizer?.email || organizer?.username} withdrawal approved — Paystack ref: ${transfer.reference}`);

      return res.json({ message: "Transfer initiated", withdrawal });

    } catch (paystackError) {
      // Roll back the availableBalance deduction
      organizer.availableBalance += withdrawal.amount;
      await organizer.save();

      withdrawal.status        = "failed";
      withdrawal.failureReason = paystackError.response?.data?.message || paystackError.message || "Transfer failed";
      withdrawal.processedBy   = req.user.id;
      withdrawal.processedAt   = new Date();
      await withdrawal.save();

      // Mark the mirrored Transaction as failed
      await Transaction.findOneAndUpdate(
        { "metadata.withdrawalId": withdrawal._id, type: "withdrawal" },
        { $set: { status: "failed" } },
      );

      console.error("Paystack transfer error:", paystackError.response?.data || paystackError.message);
      return res.status(500).json({ message: "Paystack transfer failed", error: withdrawal.failureReason });
    }

  } catch (error) {
    console.error("adminUpdateWithdrawal error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Paystack webhook: transfer.success / transfer.failed ────────────────────
// Called directly from your webhook handler — NOT an Express route.

exports.handlePaystackTransferWebhook = async (data, app = null) => {
  const { reference, status } = data;
  if (!reference) return;

  const withdrawal = await Withdrawal.findOne({
    $or: [
      { paystackReference: reference },
      { transferReference: reference },
    ],
  });

  if (!withdrawal) {
    console.warn(`handlePaystackTransferWebhook: no withdrawal found for ref ${reference}`);
    return;
  }

  // Guard: only act on withdrawals that are still in flight
  if (!["processing", "approved"].includes(withdrawal.status)) {
    console.warn(`handlePaystackTransferWebhook: withdrawal ${withdrawal._id} already in terminal state ${withdrawal.status}`);
    return;
  }

  if (status === "success") {
    await markWithdrawalCompleted(withdrawal, reference, app);
  }

  if (status === "failed") {
    // availableBalance was deducted at approval — refund it now
    await markWithdrawalFailed(withdrawal, data.reason || "Paystack transfer failed", app);
  }
};

// ─── Admin: list withdrawals ──────────────────────────────────────────────────

exports.getAdminWithdrawals = async (req, res) => {
  try {
    const { status, search, sort = "latest" } = req.query;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
    const filter = {};

    if (status && status !== "all") filter.status = status;

    const dateRange = buildDateRange(req.query.startDate, req.query.endDate);
    if (dateRange) filter.createdAt = dateRange;

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      const users = await User.find({ $or: [{ username: regex }, { email: regex }, { name: regex }] }).select("_id");
      if (!users.length) {
        return res.json({
          success: true, withdrawals: [],
          summary: { totalRequested: 0, totalCompleted: 0, totalPending: 0, totalPlatformFees: 0 },
          pagination: buildPagination(page, limit, 0),
        });
      }
      filter.organizer = { $in: users.map((u) => u._id) };
    }

    const sortOption =
      sort === "oldest"  ? { createdAt: 1 } :
      sort === "largest" ? { amount: -1, createdAt: -1 } :
      { createdAt: -1 };

    const [withdrawals, total, summaryAgg] = await Promise.all([
      Withdrawal.find(filter)
        .populate("organizer",   "name username email")
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
            _id:               null,
            totalRequested:    { $sum: "$amount" },
            totalCompleted:    { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] } },
            totalPending:      { $sum: { $cond: [{ $in: ["$status", ["pending", "approved", "processing"]] }, "$amount", 0] } },
            totalPlatformFees: { $sum: "$fee" },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      withdrawals,
      summary: summaryAgg[0] || { totalRequested: 0, totalCompleted: 0, totalPending: 0, totalPlatformFees: 0 },
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    console.error("getAdminWithdrawals error:", error);
    return res.status(500).json({ message: "Failed to fetch withdrawals" });
  }
};

exports.getWithdrawalAnalytics = async (req, res) => {
  try {
    const [summary, statusBreakdown] = await Promise.all([
      Withdrawal.aggregate([{
        $group: {
          _id:               null,
          totalPaid:         { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] } },
          totalPending:      { $sum: { $cond: [{ $in: ["$status", ["pending", "approved", "processing"]] }, "$amount", 0] } },
          totalPlatformFees: { $sum: "$fee" },
        },
      }]),
      Withdrawal.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } },
        { $sort: { count: -1 } },
      ]),
    ]);
    return res.json({ ...(summary[0] || { totalPaid: 0, totalPending: 0, totalPlatformFees: 0 }), statusBreakdown });
  } catch (error) {
    return res.status(500).json({ message: "Analytics failed" });
  }
};

exports.getMonthlyWithdrawalTrend = async (req, res) => {
  try {
    const monthly = await Withdrawal.aggregate([
      {
        $group: {
          _id:       { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          total:     { $sum: "$amount" },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);
    return res.json(monthly.map((m) => ({
      month:     `${m._id.month}/${m._id.year}`,
      total:     m.total,
      completed: m.completed,
    })));
  } catch (error) {
    return res.status(500).json({ message: "Monthly analytics failed" });
  }
};

exports.exportAdminWithdrawals = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
    const dateRange = buildDateRange(req.query.startDate, req.query.endDate);
    if (dateRange) filter.createdAt = dateRange;
    if (req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), "i");
      const users = await User.find({ $or: [{ username: regex }, { email: regex }, { name: regex }] }).select("_id");
      filter.organizer = { $in: users.map((u) => u._id) };
    }

    const withdrawals = await Withdrawal.find(filter)
      .populate("organizer", "name username email")
      .sort({ createdAt: -1 })
      .lean();

    const escape = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const rows = [
      ["Organizer", "Email", "Amount", "Fee", "Net Amount", "Status", "Paystack Ref", "Created At"],
      ...withdrawals.map((w) => [
        w.organizer?.name || w.organizer?.username || "",
        w.organizer?.email || "",
        w.amount    || 0,
        w.fee       || 0,
        w.netAmount || 0,
        w.status    || "",
        w.paystackReference || w.transferReference || "",
        w.createdAt ? new Date(w.createdAt).toISOString() : "",
      ]),
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="withdrawals.csv"');
    return res.status(200).send(rows.map((r) => r.map(escape).join(",")).join("\n"));
  } catch (error) {
    console.error("exportAdminWithdrawals error:", error);
    return res.status(500).json({ message: "Failed to export withdrawals" });
  }
};

exports.getOrganizerTransactions = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const transactions = await Transaction.find({ organizer: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(transactions);
  } catch (error) {
    console.error("getOrganizerTransactions error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};