const Payout = require("../models/Payout");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const PayoutAccount = require("../models/PayoutAccount");
const OrganizerVerification = require("../models/OrganizerVerification");
const { createNotification } = require("../services/notificationService");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parsePagination = (page, limit, fallbackLimit = DEFAULT_LIMIT) => {
  const safePage  = Math.max(Number.parseInt(page,  10) || DEFAULT_PAGE,  1);
  const safeLimit = Math.max(Number.parseInt(limit, 10) || fallbackLimit, 1);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
};

const getVerificationStatus = async (userId) => {
  const v = await OrganizerVerification.findOne({ organizer: userId }).sort({ createdAt: -1 });
  return {
    status:          v?.status || "not_started",
    isVerified:      v?.status === "approved",
    rejectionReason: v?.rejectionReason || null,
  };
};

// ─── Core: create payout when a ticket is sold ────────────────────────────────

/**
 * Called from the ticket-purchase flow.
 *
 * @param {Object} opts
 * @param {ObjectId} opts.organizerId
 * @param {ObjectId} opts.eventId
 * @param {Date}     opts.eventEndDate   — the event's end date/time
 * @param {ObjectId[]} opts.ticketIds
 * @param {number}   opts.grossAmount    — what the buyer paid (NGN)
 * @param {number}   opts.platformFee    — platform commission (NGN)
 * @param {Object}   opts.meta
 */
const createPayoutForSale = async ({
  organizerId,
  eventId,
  eventEndDate,
  ticketIds = [],
  grossAmount = 0,
  platformFee = 0,
  meta = {},
}) => {
  if (!eventEndDate) throw new Error("eventEndDate is required to create a payout");

  const netAmount = Math.max(0, grossAmount - platformFee);

  const payout = await Payout.create({
    organizer:    organizerId,
    event:        eventId,
    tickets:      ticketIds,
    grossAmount,
    platformFee,
    netAmount,
    state:        "pending",
    releaseAfter: new Date(eventEndDate), // ← funds locked until event ends
    meta,
    audit: [{ action: "created", note: "payout created on ticket sale" }],
  });

  // Reflect in organizer's pendingBalance (funds are locked in escrow)
  await User.findByIdAndUpdate(organizerId, { $inc: { pendingBalance: netAmount } });

  // Ledger entry — starts as pending, flips to success when payout is released
  await Transaction.create({
    organizer:  organizerId,
    type:       "ticket",
    amount:     grossAmount,
    fee:        platformFee,
    status:     "pending",
    reference:  meta?.reference || undefined,
    metadata:   { eventId, payoutId: payout._id },
  });

  return payout;
};

// ─── Programmatic release (used by cron + queue worker) ───────────────────────

/**
 * Moves a single payout from escrow to the organizer's availableBalance.
 * Safe to call from a background worker — does NOT touch req/res.
 */
const releasePayout = async (payoutId, actorId = null, note = "auto-release") => {
  const payout = await Payout.findById(payoutId);
  if (!payout) throw new Error("Payout not found");
  if (payout.state === "released" || payout.state === "completed") return payout;

  // Guard: only release after the event has ended
  if (payout.releaseAfter && payout.releaseAfter > new Date()) {
    throw new Error(`Payout cannot be released before event ends (${payout.releaseAfter.toISOString()})`);
  }

  const organizer = await User.findById(payout.organizer);
  if (!organizer) throw new Error("Organizer not found");

  organizer.pendingBalance   = Math.max(0, (organizer.pendingBalance   || 0) - payout.netAmount);
  organizer.availableBalance = (organizer.availableBalance || 0) + payout.netAmount;
  await organizer.save();

  payout.state       = "released";
  payout.processedBy = actorId;
  payout.processedAt = new Date();
  payout.reason      = payout.reason || note;
  payout.audit.push({ actor: actorId, action: "released", note, at: new Date() });
  await payout.save();

  // Mark the ticket transaction as successful
  await Transaction.updateMany(
    { "metadata.payoutId": payout._id },
    { $set: { status: "success" } }
  );

  // Activity log (optional — won't crash if model missing)
  try {
    if (actorId) {
      const ActivityLog = require("../models/ActivityLog");
      await ActivityLog.create({
        adminId:    actorId,
        action:     "PAYOUT_RELEASED",
        targetType: "Payout",
        targetId:   payout._id,
        details:    note || "released",
      });
    }
  } catch (e) {
    console.warn("ActivityLog write failed for payout release:", e.message);
  }

  // Notify organizer
  try {
    await createNotification(null, {
      userId:    payout.organizer,
      actorId,
      type:      "withdrawal_completed",
      message:   `Your payout of ₦${payout.netAmount.toLocaleString()} is now available for withdrawal.`,
      actionUrl: "/dashboard/earnings",
      entityId:  payout._id,
      entityType:"Payout",
    });
  } catch (e) {
    console.warn("Notification failed for payout release:", e.message);
  }

  // Email organizer
  try {
    const sendEmail = require("../utils/email");
    const o = await User.findById(payout.organizer).lean();
    if (o?.email) {
      await sendEmail({
        to:      o.email,
        subject: "Your event payout is ready",
        html:    `
          <p>Hi ${o.name || o.username},</p>
          <p>Your payout of <strong>₦${payout.netAmount.toLocaleString()}</strong> from your recent event has been released to your available balance.</p>
          <p>You can now request a withdrawal from your <a href="${process.env.APP_URL}/dashboard/earnings">earnings dashboard</a>.</p>
        `,
      });
    }
  } catch (e) {
    console.warn("Email failed for payout release:", e.message);
  }

  return payout;
};

// ─── Freeze ───────────────────────────────────────────────────────────────────

const freezePayout = async (payoutId, actorId = null, note = "manual-freeze") => {
  const payout = await Payout.findById(payoutId);
  if (!payout) throw new Error("Payout not found");

  payout.state = "frozen";
  payout.reason = note || payout.reason;
  payout.audit.push({ actor: actorId, action: "frozen", note, at: new Date() });
  await payout.save();

  try {
    await createNotification(null, {
      userId:    payout.organizer,
      actorId,
      type:      "system",
      message:   "Your payout has been frozen for review. Contact support for details.",
      actionUrl: "/support",
      entityId:  payout._id,
      entityType:"Payout",
    });
  } catch (e) {
    console.warn("Notification failed for payout freeze:", e.message);
  }

  return payout;
};

// ─── Refund ───────────────────────────────────────────────────────────────────

const refundPayout = async (payoutId, actorId = null, note = "manual-refund") => {
  const payout = await Payout.findById(payoutId);
  if (!payout) throw new Error("Payout not found");

  const organizer = await User.findById(payout.organizer);
  if (!organizer) throw new Error("Organizer not found");

  // Deduct from whichever balance holds the funds
  if (payout.state === "released") {
    organizer.availableBalance = Math.max(0, (organizer.availableBalance || 0) - payout.netAmount);
  } else {
    organizer.pendingBalance = Math.max(0, (organizer.pendingBalance || 0) - payout.netAmount);
  }
  await organizer.save();

  payout.state = "refunded";
  payout.reason = note || payout.reason;
  payout.audit.push({ actor: actorId, action: "refunded", note, at: new Date() });
  await payout.save();

  // Create a refund transaction record
  await Transaction.create({
    organizer:  payout.organizer,
    type:       "refund",
    amount:     payout.grossAmount,
    fee:        0,
    status:     "success",
    metadata:   { payoutId: payout._id },
  });

  // Mark the original ticket transaction as failed
  await Transaction.updateMany(
    { "metadata.payoutId": payout._id, type: "ticket" },
    { $set: { status: "failed" } }
  );

  try {
    await createNotification(null, {
      userId:    payout.organizer,
      actorId,
      type:      "withdrawal_failed",
      message:   `Your payout of ₦${payout.netAmount.toLocaleString()} has been refunded.`,
      actionUrl: "/support",
      entityId:  payout._id,
      entityType:"Payout",
    });
  } catch (e) {
    console.warn("Notification failed for payout refund:", e.message);
  }

  return payout;
};

// ─── HTTP handlers ────────────────────────────────────────────────────────────

const listPayouts = async (req, res) => {
  try {
    const { page = 1, limit = DEFAULT_LIMIT, state, organizer, search } = req.query;
    const { skip } = parsePagination(page, limit);
    const filter = {};

    if (state) filter.state = state;
    if (organizer) filter.organizer = organizer;

    // If an organizer is viewing their own payouts, check verification
    if (organizer && req.user?.id === organizer) {
      const vs = await getVerificationStatus(req.user.id);
      if (!vs.isVerified) {
        return res.status(403).json({
          code:              "VERIFICATION_REQUIRED",
          message:           "Organizer verification required to view payouts",
          verificationStatus:vs.status,
          rejectionReason:   vs.rejectionReason,
        });
      }
    }

    const [items, total, volumeAgg] = await Promise.all([
      Payout.find(filter)
        .populate("organizer", "name email username")
        .populate("event",     "title endDate")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Payout.countDocuments(filter),
      Payout.aggregate([
        { $match: filter },
        { $group: { _id: null, totalVolume: { $sum: "$grossAmount" }, netAmount: { $sum: "$netAmount" } } },
      ]),
    ]);

    const summary = volumeAgg[0]
      ? { totalVolume: volumeAgg[0].totalVolume, netAmount: volumeAgg[0].netAmount }
      : { totalVolume: 0, netAmount: 0 };

    return res.json({
      success: true,
      items,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) || 1 },
      summary,
    });
  } catch (error) {
    console.error("listPayouts error:", error);
    return res.status(500).json({ message: "Failed to fetch payouts" });
  }
};

const getPayout = async (req, res) => {
  try {
    const payout = await Payout.findById(req.params.id)
      .populate("organizer", "name email username")
      .populate("event",     "title endDate")
      .lean();
    if (!payout) return res.status(404).json({ message: "Payout not found" });
    return res.json({ success: true, payout });
  } catch (error) {
    console.error("getPayout error:", error);
    return res.status(500).json({ message: "Failed to fetch payout" });
  }
};

/**
 * Admin HTTP handler — wraps the programmatic helpers above.
 * action: "release" | "freeze" | "refund" | "mark_under_review" | "schedule"
 */
const adminUpdatePayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, note, releaseDate } = req.body;

    const payout = await Payout.findById(id);
    if (!payout) return res.status(404).json({ message: "Payout not found" });

    // ── Release ──────────────────────────────────────────────────────────────
    if (action === "release" || action === "approve_release") {
      // Admin can override the releaseAfter guard by supplying the action explicitly,
      // but we warn if the event hasn't ended yet (soft guard for UI, hard guard in cron).
      const now = new Date();
      if (payout.releaseAfter > now) {
        // Admin override allowed — just log it
        console.warn(`Admin releasing payout ${id} before event end (${payout.releaseAfter.toISOString()})`);
      }

      try {
        const payoutQueue = require("../queues/payoutQueue");
        const job = await payoutQueue.add(
          { type: "release", payoutId: payout._id, actorId: req.user._id, note: note || "admin-release" },
          { attempts: 5, backoff: { type: "exponential", delay: 2000 }, removeOnComplete: true }
        );
        return res.json({ success: true, queued: true, jobId: job.id });
      } catch (_) {
        // Queue unavailable — fall back to synchronous release
        const released = await releasePayout(id, req.user._id, note || "admin-direct-release");
        return res.json({ success: true, payout: released });
      }
    }

    // ── Freeze ───────────────────────────────────────────────────────────────
    if (action === "freeze") {
      try {
        const payoutQueue = require("../queues/payoutQueue");
        const job = await payoutQueue.add(
          { type: "freeze", payoutId: payout._id, actorId: req.user._id, note },
          { attempts: 3, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: true }
        );
        return res.json({ success: true, queued: true, jobId: job.id });
      } catch (_) {
        const frozen = await freezePayout(id, req.user._id, note || "admin-direct-freeze");
        return res.json({ success: true, payout: frozen });
      }
    }

    // ── Refund ───────────────────────────────────────────────────────────────
    if (action === "refund") {
      try {
        const payoutQueue = require("../queues/payoutQueue");
        const job = await payoutQueue.add(
          { type: "refund", payoutId: payout._id, actorId: req.user._id, note },
          { attempts: 3, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: true }
        );
        return res.json({ success: true, queued: true, jobId: job.id });
      } catch (_) {
        const refunded = await refundPayout(id, req.user._id, note || "admin-direct-refund");
        return res.json({ success: true, payout: refunded });
      }
    }

    // ── Mark under review ────────────────────────────────────────────────────
    if (action === "mark_under_review") {
      payout.state = "under_review";
      payout.reason = note || payout.reason;
      payout.audit.push({ actor: req.user._id, action: "under_review", note, at: new Date() });
      await payout.save();
      return res.json({ success: true, payout });
    }

    // ── Schedule (set a future release date) ─────────────────────────────────
    if (action === "schedule") {
      if (!releaseDate) return res.status(400).json({ message: "releaseDate is required for schedule action" });
      payout.state       = "scheduled";
      payout.releaseAfter = new Date(releaseDate);
      payout.reason       = note || payout.reason;
      payout.audit.push({ actor: req.user._id, action: "scheduled", note: `Scheduled for ${releaseDate}`, at: new Date() });
      await payout.save();
      return res.json({ success: true, payout });
    }

    return res.status(400).json({ message: `Unknown action: ${action}` });
  } catch (error) {
    console.error("adminUpdatePayout error:", error);
    return res.status(500).json({ message: error.message || "Failed to update payout" });
  }
};

// ─── Payout Account CRUD ──────────────────────────────────────────────────────

const { createRecipient } = require("../utils/paystack");

const connectPayoutAccount = async (req, res) => {
  try {
    const { bankName, accountNumber, accountName, bankCode } = req.body;
    const organizerId = req.user.id;

    if (!bankName || !accountNumber || !accountName || !bankCode) {
      return res.status(400).json({ message: "All bank details are required" });
    }

    const existing = await PayoutAccount.findOne({ organizer: organizerId });
    if (existing) {
      return res.status(400).json({ message: "Payout account already connected. Use the update endpoint." });
    }

    const recipientCode = await createRecipient({ bankName, accountNumber, accountName, bankCode });

    const account = await PayoutAccount.create({
      organizer:              organizerId,
      paystackRecipientCode:  recipientCode,
      bankDetails:            { bankName, accountNumber, accountName, bankCode },
      isVerified:             true,
      status:                 "active",
      lastVerifiedAt:         new Date(),
    });

    await User.findByIdAndUpdate(organizerId, { payoutAccount: account._id });

    try {
      await createNotification(req.app, {
        userId:    organizerId,
        type:      "payout_account_connected",
        message:   "Your payout account has been successfully connected.",
        actionUrl: "/dashboard/earnings",
      });
    } catch (e) { console.warn("Notification failed:", e.message); }

    return res.status(201).json({
      message: "Payout account connected successfully",
      payoutAccount: {
        id:            account._id,
        bankName:      account.bankDetails.bankName,
        accountNumber: `****${account.bankDetails.accountNumber.slice(-4)}`,
        accountName:   account.bankDetails.accountName,
        status:        account.status,
        connectedAt:   account.createdAt,
      },
    });
  } catch (error) {
    console.error("connectPayoutAccount error:", error);
    return res.status(500).json({ message: "Failed to connect payout account", error: error.message });
  }
};

const getPayoutAccount = async (req, res) => {
  try {
    const account = await PayoutAccount.findOne({ organizer: req.user.id });
    if (!account) return res.status(404).json({ message: "No payout account connected" });

    return res.json({
      id:            account._id,
      bankName:      account.bankDetails.bankName,
      accountNumber: `****${account.bankDetails.accountNumber.slice(-4)}`,
      accountName:   account.bankDetails.accountName,
      status:        account.status,
      connectedAt:   account.createdAt,
      isVerified:    account.isVerified,
    });
  } catch (error) {
    console.error("getPayoutAccount error:", error);
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

    const account = await PayoutAccount.findOne({ organizer: organizerId });
    if (!account) return res.status(404).json({ message: "No payout account found. Connect one first." });

    const recipientCode = await createRecipient({ bankName, accountNumber, accountName, bankCode });

    account.paystackRecipientCode = recipientCode;
    account.bankDetails           = { bankName, accountNumber, accountName, bankCode };
    account.isVerified            = true;
    account.lastVerifiedAt        = new Date();
    account.verificationAttempts  = 0;
    account.failureReason         = null;
    await account.save();

    try {
      await createNotification(req.app, {
        userId:    organizerId,
        type:      "payout_account_updated",
        message:   "Your payout account has been updated.",
        actionUrl: "/dashboard/earnings",
      });
    } catch (e) { console.warn("Notification failed:", e.message); }

    return res.json({
      message: "Payout account updated successfully",
      payoutAccount: {
        id:            account._id,
        bankName:      account.bankDetails.bankName,
        accountNumber: `****${account.bankDetails.accountNumber.slice(-4)}`,
        accountName:   account.bankDetails.accountName,
        status:        account.status,
        updatedAt:     account.updatedAt,
      },
    });
  } catch (error) {
    console.error("updatePayoutAccount error:", error);
    return res.status(500).json({ message: "Failed to update payout account", error: error.message });
  }
};

const disconnectPayoutAccount = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const account = await PayoutAccount.findOne({ organizer: organizerId });
    if (!account) return res.status(404).json({ message: "No payout account found" });

    const Withdrawal = require("../models/Withdrawal");
    const pending = await Withdrawal.findOne({
      organizer: organizerId,
      status: { $in: ["pending", "approved", "processing"] },
    });
    if (pending) {
      return res.status(400).json({
        message: "Cannot disconnect while a withdrawal is in progress. Contact support.",
      });
    }

    await PayoutAccount.findByIdAndDelete(account._id);
    await User.findByIdAndUpdate(organizerId, { payoutAccount: null });

    try {
      await createNotification(req.app, {
        userId:    organizerId,
        type:      "payout_account_disconnected",
        message:   "Your payout account has been disconnected.",
        actionUrl: "/dashboard/earnings",
      });
    } catch (e) { console.warn("Notification failed:", e.message); }

    return res.json({ message: "Payout account disconnected successfully" });
  } catch (error) {
    console.error("disconnectPayoutAccount error:", error);
    return res.status(500).json({ message: "Failed to disconnect payout account" });
  }
};

// ─── Single unified export ────────────────────────────────────────────────────
module.exports = {
  // Core payout lifecycle
  createPayoutForSale,
  releasePayout,
  freezePayout,
  refundPayout,

  // HTTP handlers
  listPayouts,
  getPayout,
  adminUpdatePayout,

  // Payout account
  connectPayoutAccount,
  getPayoutAccount,
  updatePayoutAccount,
  disconnectPayoutAccount,
};