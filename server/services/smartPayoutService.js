const mongoose = require("mongoose");
const Payout = require("../models/Payout");
const Event = require("../models/Event");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const PlatformSetting = require("../models/PlatformSetting");
const { createNotification } = require("./notificationService");
const sendEmail = require("../utils/email");

const ORGANIZER_LEVELS = ["NEW", "VERIFIED", "TRUSTED"];
const PAYOUT_TYPES = { EARLY: "EARLY", FINAL: "FINAL" };
const PAYOUT_STATUS = { PENDING: "PENDING", PROCESSING: "PROCESSING", PAID: "PAID", FAILED: "FAILED", REVERSED: "REVERSED" };

const getEffectiveOrganizerLevel = (organizer = {}) => {
  const storedLevel = String(organizer.organizerLevel || "NEW").toUpperCase();
  const verified = Boolean(organizer.isVerified);
  const earlyPayoutEnabled = Boolean(organizer.earlyPayoutEnabled);
  const trustScore = Number(organizer.trustScore || 0);
  const successfulEvents = Number(organizer.totalSuccessfulEvents || 0);
  const refundRate = Number(organizer.refundRate || 0);
  const disputeRate = Number(organizer.disputeRate || 0);

  if (storedLevel === "TRUSTED") {
    return "TRUSTED";
  }

  const trustedSignals =
    verified &&
    earlyPayoutEnabled &&
    successfulEvents >= 3 &&
    refundRate <= 0.05 &&
    disputeRate <= 0.03 &&
    trustScore >= 70;

  if (trustedSignals) {
    return "TRUSTED";
  }

  if (verified && earlyPayoutEnabled) {
    return "VERIFIED";
  }

  return "NEW";
};

const getOrganizerPayoutPolicy = ({ organizerLevel, isVerified, earlyPayoutEnabled }) => {
  const normalizedLevel = String(organizerLevel || "NEW").toUpperCase();
  const verified = Boolean(isVerified);
  const enabled = Boolean(earlyPayoutEnabled);

  if (normalizedLevel === "TRUSTED" && verified && enabled) {
    return { organizerLevel: normalizedLevel, allowedEarlyPercent: 80, canRequestEarlyPayout: true };
  }

  if (normalizedLevel === "VERIFIED" && verified && enabled) {
    return { organizerLevel: normalizedLevel, allowedEarlyPercent: 50, canRequestEarlyPayout: true };
  }

  return { organizerLevel: normalizedLevel, allowedEarlyPercent: 0, canRequestEarlyPayout: false };
};

const calculateEarlyPayoutAmount = (eligibleRevenue = 0, percent = 0) => {
  const safeRevenue = Number(eligibleRevenue) || 0;
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  return Math.round(safeRevenue * (safePercent / 100));
};

const getPlatformPayoutSettings = async () => {
  let settings = await PlatformSetting.findOne({ key: "platform" });
  if (!settings) {
    settings = await PlatformSetting.create({ key: "platform" });
  }

  return {
    holdingPeriodHours: Number(settings?.payouts?.holdingPeriodHours || settings?.payouts?.cooldownDaysAfterEvent || 48),
    earlyPayoutPercentVerified: Number(settings?.payouts?.earlyPayoutPercentVerified || 50),
    earlyPayoutPercentTrusted: Number(settings?.payouts?.earlyPayoutPercentTrusted || 80),
    platformFeePercent: Number(settings?.commissionPercent || 10),
    requireOrganizerVerified: Boolean(settings?.payouts?.requireOrganizerVerified),
    requireEventCompletion: Boolean(settings?.payouts?.requireEventCompletion),
  };
};

const getOrganizerTrustState = async (organizerId) => {
  const organizer = await User.findById(organizerId).lean();
  if (!organizer) return null;

  const verified = Boolean(organizer.isVerified);
  const organizerLevel = getEffectiveOrganizerLevel(organizer);
  const earlyPayoutEnabled = Boolean(organizer.earlyPayoutEnabled);

  return {
    organizer,
    organizerLevel,
    verified,
    earlyPayoutEnabled,
    policy: getOrganizerPayoutPolicy({ organizerLevel, isVerified: verified, earlyPayoutEnabled }),
  };
};

const appendPayoutLog = (payout, action, message, status = "PENDING", metadata = {}) => {
  payout.logs = Array.isArray(payout.logs) ? payout.logs : [];
  payout.logs.push({
    action,
    status,
    message,
    metadata,
    createdAt: new Date(),
  });
};

const updateEventFinancialsAfterSettlement = async (payout) => {
  if (!payout?.event) return;

  const event = await Event.findById(payout.event);
  if (!event) return;

  const balanceSource = String(payout?.metadata?.balanceSource || "escrow").toLowerCase();
  const settledAmount = Number(payout.netAmount || payout.amount || 0);

  if (balanceSource !== "advance") {
    event.remainingBalance = Math.max(0, Number(event.remainingBalance || 0) - settledAmount);
  }

  if (payout.payoutType === "FINAL" && Number(event.remainingBalance || 0) <= 0) {
    event.finalPayoutCompleted = true;
    event.payoutStatus = "PAID";
  } else if (payout.payoutType === "EARLY") {
    event.payoutStatus = event.payoutStatus || "EARLY_PAID";
  }

  await event.save();
};

const settlePayoutRecord = async ({
  payoutId,
  actorId = null,
  note = "auto-settlement",
  force = false,
  markProcessing = true,
}) => {
  const payout = await Payout.findById(payoutId);
  if (!payout) throw new Error("Payout not found");

  const currentStatus = String(payout.status || "").toUpperCase();
  const currentState = String(payout.state || "").toLowerCase();

  if (currentStatus === "PAID" || ["released", "completed"].includes(currentState)) {
    return payout;
  }

  if (!force && payout.releaseAfter && payout.releaseAfter > new Date()) {
    throw new Error(`Payout cannot be settled before ${payout.releaseAfter.toISOString()}`);
  }

  const organizer = await User.findById(payout.organizer);
  if (!organizer) throw new Error("Organizer not found");

  if (markProcessing) {
    payout.status = "PROCESSING";
    payout.state = "processing";
    appendPayoutLog(payout, "processing", note, "PROCESSING", { actorId });
    await payout.save();
  }

  const netAmount = Number(payout.netAmount || payout.amount || 0);
  const balanceSource = String(payout?.metadata?.balanceSource || "escrow").toLowerCase();

  if (balanceSource !== "advance") {
    organizer.pendingBalance = Math.max(0, Number(organizer.pendingBalance || 0) - netAmount);
  }
  organizer.availableBalance = Number(organizer.availableBalance || 0) + netAmount;
  await organizer.save();

  payout.state = payout.payoutType === "FINAL" ? "completed" : "released";
  payout.status = "PAID";
  payout.processedBy = actorId;
  payout.processedAt = new Date();
  payout.reason = payout.reason || note;
  payout.paymentProviderReference = payout.paymentProviderReference || `internal-${Date.now()}`;
  payout.logs = Array.isArray(payout.logs) ? payout.logs : [];
  appendPayoutLog(payout, "released", note, "PAID", { actorId, netAmount, balanceSource });
  payout.audit = Array.isArray(payout.audit) ? payout.audit : [];
  payout.audit.push({ actor: actorId, action: "released", note, at: new Date() });
  await payout.save();

  await Transaction.updateMany(
    { "metadata.payoutId": payout._id },
    { $set: { status: "success" } },
  );

  await updateEventFinancialsAfterSettlement(payout);

  try {
    await createNotification(null, {
      userId: payout.organizer,
      actorId,
      type: "withdrawal_completed",
      message: `Your ${payout.payoutType === "EARLY" ? "early" : "final"} payout of ₦${netAmount.toLocaleString()} is now available for withdrawal.`,
      actionUrl: "/dashboard/earnings",
      entityId: payout._id,
      entityType: "Payout",
    });
  } catch (error) {
    console.warn("Notification failed for payout settlement:", error.message);
  }

  try {
    const organizerDoc = await User.findById(payout.organizer).lean();
    if (organizerDoc?.email) {
      await sendEmail({
        to: organizerDoc.email,
        subject: `${payout.payoutType === "EARLY" ? "Early" : "Final"} payout settled`,
        html: `<p>Your ${payout.payoutType === "EARLY" ? "early" : "final"} payout of <strong>₦${netAmount.toLocaleString()}</strong> is now available for withdrawal.</p>`,
      });
    }
  } catch (error) {
    console.warn("Email failed for payout settlement:", error.message);
  }

  return payout;
};

const buildEventFinancialSnapshot = async (eventId) => {
  const event = await Event.findById(eventId);
  if (!event) throw new Error("Event not found");

  const totalTicketRevenue = Number(event.totalTicketRevenue || 0);
  const platformFee = Number(event.platformFee || 0);
  const processingFee = Number(event.processingFee || 0);
  const earlyPayoutAmount = Number(event.earlyPayoutAmount || 0);
  const remainingBalance = Number(event.remainingBalance || 0);

  return {
    event,
    totalTicketRevenue,
    platformFee,
    processingFee,
    earlyPayoutAmount,
    remainingBalance,
  };
};

const updateEventFinancials = async (eventId, patch = {}) => {
  const event = await Event.findById(eventId);
  if (!event) return null;

  const baseRevenue = Number(event.totalTicketRevenue || 0);
  const basePlatformFee = Number(event.platformFee || 0);
  const baseProcessingFee = Number(event.processingFee || 0);
  const baseEarlyPayoutAmount = Number(event.earlyPayoutAmount || 0);

  const nextRevenue = Number(patch.totalTicketRevenue ?? baseRevenue);
  const nextPlatformFee = Number(patch.platformFee ?? basePlatformFee);
  const nextProcessingFee = Number(patch.processingFee ?? baseProcessingFee);
  const nextEarlyPayoutAmount = Number(patch.earlyPayoutAmount ?? baseEarlyPayoutAmount);
  const nextRemainingBalance = Number(patch.remainingBalance ?? Math.max(0, nextRevenue - nextPlatformFee - nextProcessingFee - nextEarlyPayoutAmount));

  event.totalTicketRevenue = nextRevenue;
  event.platformFee = nextPlatformFee;
  event.processingFee = nextProcessingFee;
  event.earlyPayoutAmount = nextEarlyPayoutAmount;
  event.remainingBalance = nextRemainingBalance;
  event.payoutStatus = patch.payoutStatus || event.payoutStatus || "PENDING";
  event.eligibleForEarlyPayout = Boolean(patch.eligibleForEarlyPayout ?? event.eligibleForEarlyPayout);
  event.finalPayoutCompleted = Boolean(patch.finalPayoutCompleted ?? event.finalPayoutCompleted);

  await event.save();
  return event;
};

const ensurePayoutAccount = async (organizerId) => {
  const organizer = await User.findById(organizerId);
  if (!organizer) throw new Error("Organizer not found");

  if (!organizer.payoutAccount) {
    throw new Error("PAYOUT_ACCOUNT_REQUIRED");
  }

  return organizer;
};

const createPayoutForEarlyRelease = async ({ organizerId, eventId, payoutAmount, policyLevel }) => {
  return Payout.create({
    organizer: organizerId,
    event: eventId,
    amount: payoutAmount,
    grossAmount: payoutAmount,
    platformFee: 0,
    netAmount: payoutAmount,
    payoutType: PAYOUT_TYPES.EARLY,
    status: PAYOUT_STATUS.PENDING,
    state: "pending",
    transactionReference: `early-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    paymentProviderReference: null,
    createdAt: new Date(),
    processedAt: null,
    metadata: {
      requestedAmount: payoutAmount,
      policy: policyLevel,
      balanceSource: "advance",
      eventId,
    },
    audit: [{ action: "created", note: "early payout created" }],
  });
};

const requestEarlyPayout = async ({ organizerId, eventId, amount }) => {
  const event = await Event.findById(eventId);
  if (!event) throw new Error("Event not found");
  if (String(event.createdBy) !== String(organizerId)) throw new Error("You do not own this event");
  if (event.eventLifecycleStatus === "Ended" || event.endedAt) throw new Error("Event has already ended");

  const trustState = await getOrganizerTrustState(organizerId);
  if (!trustState) throw new Error("Organizer not found");
  if (!trustState.policy.canRequestEarlyPayout) throw new Error("Early payouts are not available for your organizer level");

  const snapshot = await buildEventFinancialSnapshot(eventId);
  const eligibleRevenue = Math.max(0, snapshot.totalTicketRevenue - snapshot.platformFee - snapshot.processingFee - snapshot.earlyPayoutAmount);
  const requestedAmount = Math.min(Number(amount || 0), eligibleRevenue);
  const maxAllowed = Math.round(eligibleRevenue * (trustState.policy.allowedEarlyPercent / 100));
  const payoutAmount = Math.min(requestedAmount, maxAllowed);

  if (payoutAmount <= 0) throw new Error("No eligible payout balance available");

  const existingPayout = await Payout.findOne({
    organizer: organizerId,
    event: eventId,
    payoutType: PAYOUT_TYPES.EARLY,
    status: { $in: [PAYOUT_STATUS.PENDING, PAYOUT_STATUS.PROCESSING, PAYOUT_STATUS.PAID] },
  });
  if (existingPayout) throw new Error("Duplicate early payout request already exists");

  await ensurePayoutAccount(organizerId);

  const payout = await createPayoutForEarlyRelease({
    organizerId,
    eventId,
    payoutAmount,
    policyLevel: trustState.policy.organizerLevel,
  });

  await updateEventFinancials(eventId, {
    earlyPayoutAmount: snapshot.earlyPayoutAmount + payoutAmount,
    remainingBalance: Math.max(0, snapshot.totalTicketRevenue - snapshot.platformFee - snapshot.processingFee - (snapshot.earlyPayoutAmount + payoutAmount)),
    payoutStatus: "EARLY_PENDING",
    eligibleForEarlyPayout: true,
    finalPayoutCompleted: false,
  });

  await createNotification(null, {
    userId: organizerId,
    actorId: organizerId,
    type: "withdrawal_completed",
    message: `Your early payout request for ₦${payoutAmount.toLocaleString()} has been approved.`,
    actionUrl: "/dashboard/payouts",
    entityId: payout._id,
    entityType: "Payout",
  });

  try {
    await sendEmail({
      to: trustState.organizer.email,
      subject: "Early payout request approved",
      html: `<p>Hi ${trustState.organizer.name || trustState.organizer.username},</p><p>Your early payout request for ₦${payoutAmount.toLocaleString()} has been approved and added to your available balance.</p>`,
    });
  } catch (error) {
    console.warn("Early payout email failed", error.message);
  }

  const settledPayout = await settlePayoutRecord({
    payoutId: payout._id,
    actorId: organizerId,
    note: "early-payout-approved",
    force: true,
  });

  return settledPayout;
};

const processFinalPayouts = async ({ batchSize = 50 } = {}) => {
  const settings = await getPlatformPayoutSettings();
  const holdingPeriodMs = Math.max(1, Number(settings.holdingPeriodHours || 48)) * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - holdingPeriodMs);

  const eligiblePayouts = await Payout.find({
    state: { $in: ["pending", "scheduled"] },
    releaseAfter: { $lte: cutoff },
    status: { $in: [PAYOUT_STATUS.PENDING, PAYOUT_STATUS.PROCESSING] },
  })
    .sort({ releaseAfter: 1, createdAt: 1 })
    .limit(batchSize)
    .lean();

  const results = [];

  for (const payout of eligiblePayouts) {
    try {
      const claimed = await Payout.findOneAndUpdate(
        {
          _id: payout._id,
          state: { $in: ["pending", "scheduled"] },
          status: { $in: [PAYOUT_STATUS.PENDING, PAYOUT_STATUS.PROCESSING] },
        },
        {
          $set: { state: "processing", status: PAYOUT_STATUS.PROCESSING },
          $push: {
            logs: {
              action: "processing",
              status: PAYOUT_STATUS.PROCESSING,
              message: "Auto payout worker claimed payout",
              metadata: { batchSize, cutoff: cutoff.toISOString() },
              createdAt: new Date(),
            },
          },
        },
        { new: true },
      ).lean();

      if (!claimed) {
        results.push({ payoutId: payout._id, status: "skipped_claimed" });
        continue;
      }

      const settled = await settlePayoutRecord({
        payoutId: claimed._id,
        actorId: null,
        note: "auto-final-payout",
        force: true,
        markProcessing: false,
      });

      results.push({
        payoutId: settled._id,
        eventId: settled.event,
        status: "paid",
        amount: settled.netAmount,
      });
    } catch (error) {
      await Payout.findByIdAndUpdate(payout._id, {
        $set: { state: "frozen", status: PAYOUT_STATUS.FAILED, reason: error.message },
        $push: {
          logs: {
            action: "failed",
            status: PAYOUT_STATUS.FAILED,
            message: error.message,
            metadata: { batchSize },
            createdAt: new Date(),
          },
        },
      });

      results.push({
        payoutId: payout._id,
        status: "error",
        error: error.message,
      });
    }
  }

  return { results, processed: results.filter((item) => item.status === "paid").length };
};

const finalizePayout = async (payoutId) => {
  return settlePayoutRecord({
    payoutId,
    actorId: null,
    note: "finalize-payout",
    force: true,
  });
};

module.exports = {
  ORGANIZER_LEVELS,
  PAYOUT_TYPES,
  PAYOUT_STATUS,
  getOrganizerPayoutPolicy,
  getEffectiveOrganizerLevel,
  calculateEarlyPayoutAmount,
  getPlatformPayoutSettings,
  getOrganizerTrustState,
  buildEventFinancialSnapshot,
  updateEventFinancials,
  ensurePayoutAccount,
  requestEarlyPayout,
  processFinalPayouts,
  finalizePayout,
  settlePayoutRecord,
};
