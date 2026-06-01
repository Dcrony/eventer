const Payout = require("../models/Payout");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const PayoutAccount = require("../models/PayoutAccount");
const { createRecipient } = require("../utils/paystack");
const { createNotification } = require("../services/notificationService");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const parsePagination = (page, limit, fallbackLimit = DEFAULT_LIMIT) => {
  const safePage = Math.max(Number.parseInt(page, 10) || DEFAULT_PAGE, 1);
  const safeLimit = Math.max(Number.parseInt(limit, 10) || fallbackLimit, 1);
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};

const createPayoutForSale = async ({ organizerId, eventId, ticketIds = [], grossAmount = 0, platformFee = 0, meta = {} }) => {
  const netAmount = Math.max(0, grossAmount - platformFee);
  const payout = await Payout.create({
    organizer: organizerId,
    event: eventId,
    tickets: ticketIds,
    grossAmount,
    platformFee,
    netAmount,
    state: "pending",
    meta,
  });

  // update organizer pending balance
  await User.findByIdAndUpdate(organizerId, { $inc: { pendingBalance: netAmount } });

  // create transaction record linking to payout
  await Transaction.create({
    organizer: organizerId,
    type: "ticket",
    amount: grossAmount,
    fee: platformFee,
    status: "pending",
    reference: meta?.reference || undefined,
    metadata: { eventId, payoutId: payout._id },
  });

  return payout;
};

const listPayouts = async (req, res) => {
  try {
    const { page = 1, limit = 20, state, organizer } = req.query;
    const { skip } = parsePagination(page, limit);
    const filter = {};
    if (state) filter.state = state;
    if (organizer) filter.organizer = organizer;

    const [items, total] = await Promise.all([
      Payout.find(filter).populate("organizer", "name email username").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Payout.countDocuments(filter),
    ]);

    return res.json({ success: true, items, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (error) {
    console.error("listPayouts error:", error);
    return res.status(500).json({ message: "Failed to fetch payouts" });
  }
};

const getPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const payout = await Payout.findById(id).populate("organizer", "name email username").lean();
    if (!payout) return res.status(404).json({ message: "Payout not found" });
    return res.json({ success: true, payout });
  } catch (error) {
    console.error("getPayout error:", error);
    return res.status(500).json({ message: "Failed to fetch payout" });
  }
};

// Admin action to change payout state and optionally release funds
const adminUpdatePayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, note, releaseDate } = req.body; // action: approve_release | freeze | mark_under_review | refund | release

    const payout = await Payout.findById(id);
    if (!payout) return res.status(404).json({ message: "Payout not found" });

    if (action === "approve_release" || action === "release") {
      if (payout.state === "released") return res.json({ success: true, payout });

      const organizer = await User.findById(payout.organizer);
      if (!organizer) return res.status(404).json({ message: "Organizer not found" });

      try {
        const payoutQueue = require("../queues/payoutQueue");
        const job = await payoutQueue.add(
          { type: "release", payoutId: payout._id, actorId: req.user._id, note: note || "admin-release" },
          { attempts: 5, backoff: { type: "exponential", delay: 2000 }, removeOnComplete: true }
        );
        return res.json({ success: true, payout, queued: true, jobId: job.id });
      } catch (e) {
        // fallback to direct release if queue not available
        organizer.pendingBalance = Math.max(0, (organizer.pendingBalance || 0) - payout.netAmount);
        organizer.availableBalance = (organizer.availableBalance || 0) + payout.netAmount;
        await organizer.save();

        payout.state = "released";
        payout.processedBy = req.user._id;
        payout.processedAt = new Date();
        payout.reason = note || payout.reason;
        if (releaseDate) payout.releaseDate = new Date(releaseDate);
        payout.audit.push({ actor: req.user._id, action: "released", note, at: new Date() });
        await payout.save();

        await Transaction.updateMany({ "metadata.payoutId": payout._id }, { $set: { status: "success" } });

        try {
          const ActivityLog = require("../models/ActivityLog");
          await ActivityLog.create({ adminId: req.user._id, action: "PAYOUT_RELEASED", targetType: "Payout", targetId: payout._id, details: note || "admin direct release" });
        } catch (e2) {
          console.warn("Failed to log activity for direct release:", e2.message || e2);
        }

        try {
          await createNotification(req.app, {
            userId: payout.organizer,
            actorId: req.user._id,
            type: "withdrawal_completed",
            message: `Your payout of ₦${payout.netAmount.toLocaleString()} has been released to your available balance.`,
            actionUrl: "/dashboard/payouts",
            entityId: payout._id,
            entityType: "Payout",
          });
        } catch (e3) {
          console.warn("Failed to create notification for direct release:", e3.message || e3);
        }

        return res.json({ success: true, payout });
      }
    }

    if (action === "freeze") {
      try {
        const payoutQueue = require("../queues/payoutQueue");
        const job = await payoutQueue.add(
          { type: "freeze", payoutId: payout._id, actorId: req.user._id, note },
          { attempts: 3, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: true }
        );
        return res.json({ success: true, payout, queued: true, jobId: job.id });
      } catch (e) {
        payout.state = "frozen";
        payout.reason = note || payout.reason;
        payout.audit.push({ actor: req.user._id, action: "frozen", note, at: new Date() });
        await payout.save();

        try {
          const ActivityLog = require("../models/ActivityLog");
          await ActivityLog.create({ adminId: req.user._id, action: "PAYOUT_FROZEN", targetType: "Payout", targetId: payout._id, details: note || "frozen by admin" });
        } catch (e2) {
          console.warn("Failed to log activity for direct freeze:", e2.message || e2);
        }

        try {
          await createNotification(req.app, {
            userId: payout.organizer,
            actorId: req.user._id,
            type: "system",
            message: `Your payout has been frozen for review.`,
            actionUrl: "/support",
            entityId: payout._id,
            entityType: "Payout",
          });
        } catch (e3) {
          console.warn("Failed to notify organizer for direct freeze:", e3.message || e3);
        }

        return res.json({ success: true, payout });
      }
    }

    if (action === "mark_under_review") {
      payout.state = "under_review";
      payout.reason = note || payout.reason;
      payout.audit.push({ actor: req.user._id, action: "under_review", note, at: new Date() });
      await payout.save();
      return res.json({ success: true, payout });
    }

    if (action === "refund") {
      try {
        const payoutQueue = require("../queues/payoutQueue");
        const job = await payoutQueue.add(
          { type: "refund", payoutId: payout._id, actorId: req.user._id, note },
          { attempts: 3, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: true }
        );
        return res.json({ success: true, payout, queued: true, jobId: job.id });
      } catch (e) {
        const organizer = await User.findById(payout.organizer);
        if (!organizer) return res.status(404).json({ message: "Organizer not found" });

        organizer.pendingBalance = Math.max(0, (organizer.pendingBalance || 0) - payout.netAmount);
        await organizer.save();

        payout.state = "refunded";
        payout.reason = note || payout.reason;
        payout.audit.push({ actor: req.user._id, action: "refunded", note, at: new Date() });
        await payout.save();

        await Transaction.create({
          organizer: payout.organizer,
          type: "refund",
          amount: payout.grossAmount,
          fee: 0,
          status: "success",
          metadata: { payoutId: payout._id },
        });

        try {
          const ActivityLog = require("../models/ActivityLog");
          await ActivityLog.create({ adminId: req.user._id, action: "PAYOUT_REFUNDED", targetType: "Payout", targetId: payout._id, details: note || "refunded by admin" });
        } catch (e2) {
          console.warn("Failed to log activity for direct refund:", e2.message || e2);
        }

        try {
          await createNotification(req.app, {
            userId: payout.organizer,
            actorId: req.user._id,
            type: "withdrawal_failed",
            message: `Your payout has been refunded.`,
            actionUrl: "/support",
            entityId: payout._id,
            entityType: "Payout",
          });
        } catch (e3) {
          console.warn("Failed to notify organizer for direct refund:", e3.message || e3);
        }

        return res.json({ success: true, payout });
      }
    }

    return res.status(400).json({ message: "Unknown action" });
  } catch (error) {
    console.error("adminUpdatePayout error:", error);
    return res.status(500).json({ message: "Failed to update payout" });
  }
};

const freezePayout = async (payoutId, actorId = null, note = "manual-freeze") => {
  const payout = await Payout.findById(payoutId);
  if (!payout) throw new Error("Payout not found");
  payout.state = "frozen";
  payout.reason = note || payout.reason;
  payout.audit.push({ actor: actorId, action: "frozen", note, at: new Date() });
  await payout.save();
  return payout;
};

const refundPayout = async (payoutId, actorId = null, note = "manual-refund") => {
  const payout = await Payout.findById(payoutId);
  if (!payout) throw new Error("Payout not found");

  const organizer = await User.findById(payout.organizer);
  if (!organizer) throw new Error("Organizer not found");

  organizer.pendingBalance = Math.max(0, (organizer.pendingBalance || 0) - payout.netAmount);
  await organizer.save();

  payout.state = "refunded";
  payout.reason = note || payout.reason;
  payout.audit.push({ actor: actorId, action: "refunded", note, at: new Date() });
  await payout.save();

  await Transaction.create({
    organizer: payout.organizer,
    type: "refund",
    amount: payout.grossAmount,
    fee: 0,
    status: "success",
    metadata: { payoutId: payout._id },
  });

  return payout;
};

// Programmatic release used by background worker or admin automation
const releasePayout = async (payoutId, actorId = null, note = "auto-release") => {
  const payout = await Payout.findById(payoutId);
  if (!payout) throw new Error("Payout not found");
  if (payout.state === "released") return payout;

  const organizer = await User.findById(payout.organizer);
  if (!organizer) throw new Error("Organizer not found");

  organizer.pendingBalance = Math.max(0, (organizer.pendingBalance || 0) - payout.netAmount);
  organizer.availableBalance = (organizer.availableBalance || 0) + payout.netAmount;
  await organizer.save();

  payout.state = "released";
  payout.processedBy = actorId;
  payout.processedAt = new Date();
  payout.reason = payout.reason || note;
  payout.audit.push({ actor: actorId, action: "released", note, at: new Date() });
  await payout.save();

  await Transaction.updateMany({ "metadata.payoutId": payout._id }, { $set: { status: "success" } });

  try {
    if (actorId) {
      const ActivityLog = require("../models/ActivityLog");
      await ActivityLog.create({ adminId: actorId, action: "PAYOUT_RELEASED", targetType: "Payout", targetId: payout._id, details: note || "released" });
    }
  } catch (e) {
    console.warn("Failed to create activity log for payout release:", e.message || e);
  }

  try {
    await createNotification(null, {
      userId: payout.organizer,
      actorId,
      type: "withdrawal_completed",
      message: `Your payout of ₦${payout.netAmount.toLocaleString()} has been released to your available balance.`,
      actionUrl: "/dashboard/payouts",
      entityId: payout._id,
      entityType: "Payout",
    });
  } catch (e) {
    console.warn("Failed to create notification for payout release:", e.message || e);
  }

  try {
    const sendEmail = require("../utils/email");
    const o = await User.findById(payout.organizer);
    if (o?.email) {
      await sendEmail({ to: o.email, subject: "Payout released", html: `Your payout of ₦${payout.netAmount.toLocaleString()} has been released.` });
    }
  } catch (e) {
    console.warn("Failed to email organizer for payout release:", e.message || e);
  }

  return payout;
};

// ─── Payout Account Functions ─────────────────────────────────────────────────

const connectPayoutAccount = async (req, res) => {
  try {
    const { bankName, accountNumber, accountName, bankCode } = req.body;
    const organizerId = req.user.id;

    if (!bankName || !accountNumber || !accountName || !bankCode) {
      return res.status(400).json({ message: "All bank details are required" });
    }

    const existingAccount = await PayoutAccount.findOne({ organizer: organizerId });
    if (existingAccount) {
      return res.status(400).json({ message: "Payout account already connected. Use update endpoint to change details." });
    }

    const recipientCode = await createRecipient({ bankName, accountNumber, accountName, bankCode });

    const payoutAccount = await PayoutAccount.create({
      organizer: organizerId,
      paystackRecipientCode: recipientCode,
      bankDetails: { bankName, accountNumber, accountName, bankCode },
      isVerified: true,
      status: "active",
      lastVerifiedAt: new Date(),
    });

    await User.findByIdAndUpdate(organizerId, { payoutAccount: payoutAccount._id });

    await createNotification(req.app, {
      userId: organizerId,
      type: "payout_account_connected",
      message: "Your payout account has been successfully connected",
      actionUrl: "/earnings",
    });

    return res.status(201).json({
      message: "Payout account connected successfully",
      payoutAccount: {
        id: payoutAccount._id,
        bankName: payoutAccount.bankDetails.bankName,
        accountNumber: `****${payoutAccount.bankDetails.accountNumber.slice(-4)}`,
        accountName: payoutAccount.bankDetails.accountName,
        status: payoutAccount.status,
        connectedAt: payoutAccount.createdAt,
      },
    });
  } catch (error) {
    console.error("Connect payout account error:", error);
    return res.status(500).json({ message: "Failed to connect payout account", error: error.message });
  }
};

const getPayoutAccount = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const payoutAccount = await PayoutAccount.findOne({ organizer: organizerId });

    if (!payoutAccount) {
      return res.status(404).json({ message: "No payout account connected" });
    }

    return res.json({
      id: payoutAccount._id,
      bankName: payoutAccount.bankDetails.bankName,
      accountNumber: `****${payoutAccount.bankDetails.accountNumber.slice(-4)}`,
      accountName: payoutAccount.bankDetails.accountName,
      status: payoutAccount.status,
      connectedAt: payoutAccount.createdAt,
      isVerified: payoutAccount.isVerified,
    });
  } catch (error) {
    console.error("Get payout account error:", error);
    return res.status(500).json({ message: "Failed to retrieve payout account" });
  }
};

const updatePayoutAccount = async (req, res) => {
  try {
    const { bankName, accountNumber, accountName, bankCode } = req.body;
    const organizerId = req.user.id;

    if (!bankName || !accountNumber || !accountName || !bankCode) {
      return res.status(400).json({ message: "All bank details are required" });
    }

    const payoutAccount = await PayoutAccount.findOne({ organizer: organizerId });
    if (!payoutAccount) {
      return res.status(404).json({ message: "No payout account found. Please connect an account first." });
    }

    const recipientCode = await createRecipient({ bankName, accountNumber, accountName, bankCode });

    payoutAccount.paystackRecipientCode = recipientCode;
    payoutAccount.bankDetails = { bankName, accountNumber, accountName, bankCode };
    payoutAccount.isVerified = true;
    payoutAccount.lastVerifiedAt = new Date();
    payoutAccount.verificationAttempts = 0;
    payoutAccount.failureReason = null;
    await payoutAccount.save();

    await createNotification(req.app, {
      userId: organizerId,
      type: "payout_account_updated",
      message: "Your payout account has been successfully updated",
      actionUrl: "/earnings",
    });

    return res.json({
      message: "Payout account updated successfully",
      payoutAccount: {
        id: payoutAccount._id,
        bankName: payoutAccount.bankDetails.bankName,
        accountNumber: `****${payoutAccount.bankDetails.accountNumber.slice(-4)}`,
        accountName: payoutAccount.bankDetails.accountName,
        status: payoutAccount.status,
        updatedAt: payoutAccount.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update payout account error:", error);
    return res.status(500).json({ message: "Failed to update payout account", error: error.message });
  }
};

const disconnectPayoutAccount = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const payoutAccount = await PayoutAccount.findOne({ organizer: organizerId });
    if (!payoutAccount) {
      return res.status(404).json({ message: "No payout account found" });
    }

    const Withdrawal = require("../models/Withdrawal");
    const pendingWithdrawals = await Withdrawal.findOne({
      organizer: organizerId,
      status: { $in: ["pending", "approved", "processing"] },
    });

    if (pendingWithdrawals) {
      return res.status(400).json({ message: "Cannot disconnect payout account with pending withdrawals. Please wait for completion or contact support." });
    }

    await PayoutAccount.findByIdAndDelete(payoutAccount._id);
    await User.findByIdAndUpdate(organizerId, { payoutAccount: null });

    await createNotification(req.app, {
      userId: organizerId,
      type: "payout_account_disconnected",
      message: "Your payout account has been disconnected",
      actionUrl: "/earnings",
    });

    return res.json({ message: "Payout account disconnected successfully" });
  } catch (error) {
    console.error("Disconnect payout account error:", error);
    return res.status(500).json({ message: "Failed to disconnect payout account" });
  }
};

// ─── Single unified export ────────────────────────────────────────────────────
module.exports = {
  // Payout core
  createPayoutForSale,
  listPayouts,
  getPayout,
  adminUpdatePayout,
  freezePayout,
  refundPayout,
  releasePayout,

  // Payout account CRUD
  connectPayoutAccount,
  getPayoutAccount,
  updatePayoutAccount,
  disconnectPayoutAccount,
};