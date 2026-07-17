const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const PayoutAccount = require("../models/PayoutAccount");
const OrganizerVerification = require("../models/OrganizerVerification");
const ActivityLog = require("../models/ActivityLog");
const { capOrganizerAvailableBalance } = require("../utils/organizerBalance");
const { initiateTransfer } = require("../utils/paystack");
const { createNotification } = require("./notificationService");
const sendEmail = require("../utils/email");

const WITHDRAWAL_STATUS = {
  PENDING_ADMIN_APPROVAL: "PENDING_ADMIN_APPROVAL",
  PROCESSING: "PROCESSING",
  PAID: "PAID",
  FAILED: "FAILED",
  REVERSED: "REVERSED",
};

const terminalStatuses = new Set([WITHDRAWAL_STATUS.PAID, WITHDRAWAL_STATUS.FAILED, WITHDRAWAL_STATUS.REVERSED]);
const inFlightStatuses = new Set([WITHDRAWAL_STATUS.PROCESSING, "processing", "approved"]);

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isFirstWithdrawal = (organizer) => Number(organizer?.successfulWithdrawals || 0) <= 0;

const getApprovalMode = (organizer) => ({
  requiresAdminApproval: isFirstWithdrawal(organizer),
  automaticWithdrawalEnabled: Boolean(organizer?.automaticWithdrawalEnabled) && !isFirstWithdrawal(organizer),
  firstWithdrawalApproved: Boolean(organizer?.firstWithdrawalApproved),
});

const appendWithdrawalLog = (withdrawal, action, status, message, metadata = {}) => {
  withdrawal.logs = Array.isArray(withdrawal.logs) ? withdrawal.logs : [];
  withdrawal.logs.push({
    action,
    status,
    message,
    metadata,
    createdAt: new Date(),
  });
};

const appendWithdrawalAudit = (withdrawal, action, note, actor = null) => {
  withdrawal.audit = Array.isArray(withdrawal.audit) ? withdrawal.audit : [];
  withdrawal.audit.push({ actor, action, note, at: new Date() });
};

const getWithdrawalByReference = async (reference) =>
  Withdrawal.findOne({
    $or: [
      { transferReference: reference },
      { paystackReference: reference },
    ],
  }).populate("organizer");

const normalizeLegacyWithdrawalStatus = (status) => {
  const normalized = String(status || "").trim();
  if (normalized === "pending") return WITHDRAWAL_STATUS.PENDING_ADMIN_APPROVAL;
  if (normalized === "approved" || normalized === "processing") return WITHDRAWAL_STATUS.PROCESSING;
  if (normalized === "completed") return WITHDRAWAL_STATUS.PAID;
  if (normalized === "failed" || normalized === "rejected") return WITHDRAWAL_STATUS.FAILED;
  return normalized.toUpperCase();
};

const getRecipientCode = async (organizer) => {
  const payoutAccountId = organizer?.payoutAccount?._id || organizer?.payoutAccount;
  if (!payoutAccountId) {
    throw new Error("PAYOUT_ACCOUNT_REQUIRED");
  }

  const payoutAccount = organizer?.payoutAccount?.paystackRecipientCode
    ? organizer.payoutAccount
    : await PayoutAccount.findById(payoutAccountId).lean();

  if (!payoutAccount?.paystackRecipientCode) {
    throw new Error("Organizer has no valid Paystack recipient code");
  }

  if (payoutAccount.status && payoutAccount.status !== "active") {
    throw new Error("Your payout account is not active");
  }

  return payoutAccount.paystackRecipientCode;
};

const updateTransactionForWithdrawal = async (withdrawal, status, reference = null) => {
  await Transaction.updateMany(
    {
      $or: [
        { "metadata.withdrawalId": withdrawal._id, type: "withdrawal" },
        { referenceId: withdrawal._id, type: "withdrawal" },
      ],
    },
    {
      $set: {
        status,
        reference: reference || withdrawal.transferReference || withdrawal.paystackReference || null,
      },
    },
  );
};

const updateOrganizerSuccessfulWithdrawalState = async (organizerId) => {
  await User.findByIdAndUpdate(organizerId, {
    $inc: { successfulWithdrawals: 1 },
    $set: {
      automaticWithdrawalEnabled: true,
      firstWithdrawalApproved: true,
      lastWithdrawalDate: new Date(),
    },
  });
};

const notifyWithdrawalStatus = async (app, withdrawal, type, message, actionUrl = "/dashboard/transactions") => {
  try {
    await createNotification(app, {
      userId: withdrawal.organizer,
      type,
      message,
      actionUrl,
      entityId: withdrawal._id,
      entityType: "withdrawal",
    });
  } catch (error) {
    console.warn(`Notification failed (${type}):`, error.message);
  }
};

const sendWithdrawalEmail = async (organizer, subject, html) => {
  if (!organizer?.email) return;
  await sendEmail({
    to: organizer.email,
    subject,
    html,
  });
};

const reserveOrganizerBalance = async (organizerId, amount) => {
  const organizer = await User.findById(organizerId);
  if (!organizer) throw new Error("Organizer not found");

  const cap = await capOrganizerAvailableBalance(organizerId, organizer.availableBalance);
  if (amount > cap) {
    throw new Error("Insufficient available balance");
  }

  organizer.availableBalance = Math.max(0, Number(organizer.availableBalance || 0) - Number(amount || 0));
  await organizer.save();
  return organizer;
};

const releaseReservedBalance = async (organizerId, amount) => {
  if (!amount) return;
  await User.findByIdAndUpdate(organizerId, {
    $inc: { availableBalance: Number(amount || 0) },
  });
};

const initiateWithdrawalTransfer = async ({
  withdrawalId,
  actorId = null,
  app = null,
  note = "withdrawal-transfer",
  reserveFunds = true,
}) => {
  const withdrawal = await Withdrawal.findById(withdrawalId).populate("organizer");
  if (!withdrawal) throw new Error("Withdrawal not found");

  const normalizedStatus = normalizeLegacyWithdrawalStatus(withdrawal.status);
  if (terminalStatuses.has(normalizedStatus)) {
    return withdrawal;
  }

  if (normalizedStatus === WITHDRAWAL_STATUS.PROCESSING && withdrawal.paystackReference) {
    return withdrawal;
  }

  const organizer = withdrawal.organizer;
  if (!organizer) throw new Error("Organizer not found");

  const recipientCode = await getRecipientCode(organizer);

  if (reserveFunds) {
    await reserveOrganizerBalance(organizer._id, withdrawal.amount);
  }

  try {
    const transferReference =
      normalizedStatus === WITHDRAWAL_STATUS.FAILED
        ? `ts_withdrawal_${withdrawal._id}_retry_${Date.now()}`
        : withdrawal.transferReference || `ts_withdrawal_${withdrawal._id}_${Date.now()}`;
    const claimedWithdrawal = await Withdrawal.findOneAndUpdate(
      {
        _id: withdrawal._id,
        status: { $in: [WITHDRAWAL_STATUS.PENDING_ADMIN_APPROVAL, "pending", "approved", WITHDRAWAL_STATUS.PROCESSING, WITHDRAWAL_STATUS.FAILED, "failed"] },
        $or: [
          { paystackReference: { $in: [null, ""] } },
          { status: { $in: [WITHDRAWAL_STATUS.FAILED, "failed"] } },
        ],
      },
      {
        $set: {
          transferReference,
          paystackReference: transferReference,
          status: WITHDRAWAL_STATUS.PROCESSING,
          processedBy: actorId,
          processedAt: new Date(),
          failureReason: null,
        },
        $push: {
          logs: {
            action: "processing",
            status: WITHDRAWAL_STATUS.PROCESSING,
            message: note,
            metadata: { actorId, reserveFunds },
            createdAt: new Date(),
          },
          audit: { actor: actorId, action: "processing", note, at: new Date() },
        },
      },
      { new: true },
    );

    if (!claimedWithdrawal) {
      const latest = await Withdrawal.findById(withdrawal._id).populate("organizer");
      if (normalizeLegacyWithdrawalStatus(latest?.status) === WITHDRAWAL_STATUS.PROCESSING) return latest;
      throw new Error("Withdrawal could not be claimed for processing");
    }

    withdrawal.transferReference = claimedWithdrawal.transferReference;
    withdrawal.paystackReference = claimedWithdrawal.paystackReference;
    withdrawal.status = claimedWithdrawal.status;
    withdrawal.processedBy = claimedWithdrawal.processedBy;
    withdrawal.processedAt = claimedWithdrawal.processedAt;
    withdrawal.logs = claimedWithdrawal.logs;
    withdrawal.audit = claimedWithdrawal.audit;

    await updateTransactionForWithdrawal(withdrawal, "pending", transferReference);

    const transfer = await initiateTransfer(
      Math.round(Number(withdrawal.netAmount || withdrawal.amount || 0) * 100),
      recipientCode,
      transferReference,
    );

    withdrawal.paystackReference = transfer.reference || transferReference;
    withdrawal.transferReference = transfer.reference || transferReference;
    appendWithdrawalLog(withdrawal, "transfer_initiated", WITHDRAWAL_STATUS.PROCESSING, "Paystack transfer initiated", {
      paystackStatus: transfer.status,
      transferReference: withdrawal.transferReference,
    });
    await withdrawal.save();

    await updateTransactionForWithdrawal(withdrawal, "pending", withdrawal.transferReference);

    await notifyWithdrawalStatus(
      app,
      withdrawal,
      "withdrawal_processing",
      `Your withdrawal of ₦${Number(withdrawal.amount || 0).toLocaleString()} is being processed.`,
    );

    try {
      await sendWithdrawalEmail(
        organizer,
        "Withdrawal processing",
        `<p>Your withdrawal of <strong>₦${Number(withdrawal.amount || 0).toLocaleString()}</strong> is being processed.</p>`,
      );
    } catch (error) {
      console.warn("Withdrawal processing email failed:", error.message);
    }

    return withdrawal;
  } catch (error) {
    if (reserveFunds) {
      await releaseReservedBalance(organizer._id, withdrawal.amount);
    }

    withdrawal.status = WITHDRAWAL_STATUS.FAILED;
    withdrawal.failureReason = error.response?.data?.message || error.message || "Transfer failed";
    appendWithdrawalLog(withdrawal, "failed", WITHDRAWAL_STATUS.FAILED, withdrawal.failureReason, {
      actorId,
      note,
    });
    appendWithdrawalAudit(withdrawal, "failed", withdrawal.failureReason, actorId);
    await withdrawal.save();

    await updateTransactionForWithdrawal(withdrawal, "failed", withdrawal.transferReference);
    await notifyWithdrawalStatus(
      app,
      withdrawal,
      "withdrawal_failed",
      `Your withdrawal of ₦${Number(withdrawal.amount || 0).toLocaleString()} failed. ${withdrawal.failureReason}`,
      "/support",
    );
    return withdrawal;
  }
};

const finalizeWithdrawalFromWebhook = async ({ eventName, payload, app = null }) => {
  const reference = payload.reference || payload.transfer_code || payload.transferCode || payload.transfer?.reference || null;
  const status = String(payload.status || payload.transfer?.status || "").toLowerCase();
  const eventKey = `${eventName}:${payload.id || payload.transfer_code || payload.transferCode || reference}:${status || "unknown"}`;

  if (!reference) {
    return { handled: false, reason: "missing_reference" };
  }

  const claimed = await Withdrawal.findOneAndUpdate(
    {
      $or: [
        { transferReference: reference },
        { paystackReference: reference },
      ],
      webhookEventKeys: { $ne: eventKey },
    },
    { $addToSet: { webhookEventKeys: eventKey } },
    { new: true },
  );

  if (!claimed) {
    const existing = await getWithdrawalByReference(reference);
    return { handled: false, reason: existing ? "already_processed" : "not_found", withdrawal: existing };
  }

  const withdrawal = await Withdrawal.findById(claimed._id).populate("organizer");
  if (!withdrawal) {
    return { handled: false, reason: "not_found" };
  }

  const currentStatus = normalizeLegacyWithdrawalStatus(withdrawal.status);
  const isDuplicateTerminalEvent =
    (eventName === "transfer.success" && currentStatus === WITHDRAWAL_STATUS.PAID) ||
    (eventName === "transfer.failed" && currentStatus === WITHDRAWAL_STATUS.FAILED) ||
    (eventName === "transfer.reversed" && currentStatus === WITHDRAWAL_STATUS.REVERSED);

  if (isDuplicateTerminalEvent) {
    return { handled: false, reason: "already_processed", withdrawal };
  }

  const organizer = withdrawal.organizer;
  if (!organizer) {
    return { handled: false, reason: "missing_organizer", withdrawal };
  }

  if (eventName === "transfer.success" || status === "success") {
    if (currentStatus === WITHDRAWAL_STATUS.PAID) {
      return { handled: false, reason: "already_paid", withdrawal };
    }
    if (!inFlightStatuses.has(String(withdrawal.status)) && currentStatus !== WITHDRAWAL_STATUS.PROCESSING) {
      return { handled: false, reason: "invalid_success_transition", withdrawal };
    }

    withdrawal.status = WITHDRAWAL_STATUS.PAID;
    withdrawal.completedAt = new Date();
    withdrawal.processedAt = withdrawal.processedAt || new Date();
    withdrawal.paystackReference = reference;
    withdrawal.transferReference = reference;
    appendWithdrawalLog(withdrawal, "paid", WITHDRAWAL_STATUS.PAID, "Paystack transfer successful", { eventName });
    appendWithdrawalAudit(withdrawal, "paid", "Paystack transfer successful", null);
    await withdrawal.save();

    await updateTransactionForWithdrawal(withdrawal, "success", reference);
    await updateOrganizerSuccessfulWithdrawalState(organizer._id);

    await notifyWithdrawalStatus(
      app,
      withdrawal,
      "withdrawal_completed",
      `Your withdrawal of ₦${Number(withdrawal.netAmount || withdrawal.amount || 0).toLocaleString()} was successful.`,
    );

    try {
      await sendWithdrawalEmail(
        organizer,
        "Withdrawal successful",
        `<p>Your withdrawal of <strong>₦${Number(withdrawal.netAmount || withdrawal.amount || 0).toLocaleString()}</strong> was successful.</p>`,
      );
    } catch (error) {
      console.warn("Withdrawal success email failed:", error.message);
    }

    return { handled: true, withdrawal };
  }

  if (eventName === "transfer.failed" || status === "failed") {
    if (currentStatus === WITHDRAWAL_STATUS.FAILED) {
      return { handled: false, reason: "already_failed", withdrawal };
    }
    if (!inFlightStatuses.has(String(withdrawal.status)) && currentStatus !== WITHDRAWAL_STATUS.PROCESSING) {
      return { handled: false, reason: "invalid_failed_transition", withdrawal };
    }

    withdrawal.status = WITHDRAWAL_STATUS.FAILED;
    withdrawal.failureReason = payload.reason || payload.failure_reason || "Transfer failed";
    withdrawal.paystackReference = reference;
    withdrawal.transferReference = reference;
    appendWithdrawalLog(withdrawal, "failed", WITHDRAWAL_STATUS.FAILED, withdrawal.failureReason, { eventName });
    appendWithdrawalAudit(withdrawal, "failed", withdrawal.failureReason, null);
    await withdrawal.save();

    await updateTransactionForWithdrawal(withdrawal, "failed", reference);
    await releaseReservedBalance(organizer._id, withdrawal.amount);

    await notifyWithdrawalStatus(
      app,
      withdrawal,
      "withdrawal_failed",
      `Your withdrawal of ₦${Number(withdrawal.amount || 0).toLocaleString()} failed. Funds were returned to your balance.`,
      "/support",
    );

    try {
      await sendWithdrawalEmail(
        organizer,
        "Withdrawal failed",
        `<p>Your withdrawal of <strong>₦${Number(withdrawal.amount || 0).toLocaleString()}</strong> failed. Funds were returned to your balance.</p>`,
      );
    } catch (error) {
      console.warn("Withdrawal failed email failed:", error.message);
    }

    return { handled: true, withdrawal };
  }

  if (eventName === "transfer.reversed" || status === "reversed") {
    if (currentStatus === WITHDRAWAL_STATUS.REVERSED) {
      return { handled: false, reason: "already_reversed", withdrawal };
    }
    if (![WITHDRAWAL_STATUS.PAID, WITHDRAWAL_STATUS.PROCESSING].includes(currentStatus)) {
      return { handled: false, reason: "invalid_reversed_transition", withdrawal };
    }

    withdrawal.status = WITHDRAWAL_STATUS.REVERSED;
    withdrawal.failureReason = payload.reason || payload.failure_reason || "Transfer reversed";
    withdrawal.paystackReference = reference;
    withdrawal.transferReference = reference;
    appendWithdrawalLog(withdrawal, "reversed", WITHDRAWAL_STATUS.REVERSED, withdrawal.failureReason, { eventName });
    appendWithdrawalAudit(withdrawal, "reversed", withdrawal.failureReason, null);
    await withdrawal.save();

    await updateTransactionForWithdrawal(withdrawal, "reversed", reference);
    await releaseReservedBalance(organizer._id, withdrawal.amount);

    await notifyWithdrawalStatus(
      app,
      withdrawal,
      "withdrawal_reversed",
      `Your withdrawal of ₦${Number(withdrawal.amount || 0).toLocaleString()} was reversed.`,
      "/dashboard/transactions",
    );

    try {
      await sendWithdrawalEmail(
        organizer,
        "Withdrawal reversed",
        `<p>Your withdrawal of <strong>₦${Number(withdrawal.amount || 0).toLocaleString()}</strong> was reversed.</p>`,
      );
    } catch (error) {
      console.warn("Withdrawal reversed email failed:", error.message);
    }

    return { handled: true, withdrawal };
  }

  return { handled: false, reason: "unsupported_status", withdrawal };
};

const requestWithdrawal = async ({ organizerId, amount, app = null }) => {
  const organizer = await User.findById(organizerId).populate("payoutAccount");
  if (!organizer) throw new Error("Organizer not found");

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid amount");
  }

  const minimumWithdrawal = Number(process.env.MIN_WITHDRAWAL_NGN || 1000);
  if (numericAmount < minimumWithdrawal) {
    throw new Error(`Minimum withdrawal is ₦${minimumWithdrawal.toLocaleString()}`);
  }

  const verification = await OrganizerVerification.findOne({ organizer: organizerId }).sort({ createdAt: -1 });
  if (verification?.status !== "approved") {
    const error = new Error("Complete your organizer verification before withdrawing");
    error.code = "VERIFICATION_REQUIRED";
    error.verificationStatus = verification?.status || "not_started";
    error.rejectionReason = verification?.rejectionReason || null;
    throw error;
  }

  try {
    const fraudService = require("../services/fraudService");
    const flagged = await fraudService.isOrganizerFlagged(organizerId);
    if (flagged) {
      const error = new Error("Withdrawals blocked due to account review");
      error.code = "WITHDRAWAL_BLOCKED_FRAUD";
      throw error;
    }
  } catch (error) {
    if (error.code !== "WITHDRAWAL_BLOCKED_FRAUD") {
      console.warn("Fraud check failed (non-fatal):", error.message);
    } else {
      throw error;
    }
  }

  const payoutMode = getApprovalMode(organizer);
  const needsApproval = payoutMode.requiresAdminApproval;

  if (!organizer.payoutAccount) {
    const error = new Error("Connect a bank account before withdrawing");
    error.code = "PAYOUT_ACCOUNT_REQUIRED";
    throw error;
  }
  if (organizer.payoutAccount.status !== "active") {
    const error = new Error("Your payout account is not active");
    error.code = "PAYOUT_ACCOUNT_INACTIVE";
    throw error;
  }

  const maxWithdrawable = await capOrganizerAvailableBalance(organizerId, organizer.availableBalance);
  if (numericAmount > maxWithdrawable) {
    const error = new Error("Insufficient available balance");
    error.availableBalance = maxWithdrawable;
    error.requestedAmount = numericAmount;
    throw error;
  }

  const fee = Math.round((numericAmount * Number(process.env.WITHDRAWAL_FEE_PERCENT || 2)) / 100);
  const netAmount = numericAmount - fee;

  const withdrawal = await Withdrawal.create({
    organizer: organizerId,
    amount: numericAmount,
    fee,
    netAmount,
    paymentMethod: "bank",
    bankDetails: organizer.payoutAccount.bankDetails,
    status: needsApproval ? WITHDRAWAL_STATUS.PENDING_ADMIN_APPROVAL : WITHDRAWAL_STATUS.PROCESSING,
    processedBy: needsApproval ? null : organizerId,
    processedAt: needsApproval ? null : new Date(),
    transferReference: needsApproval ? null : `ts_withdrawal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    paystackReference: null,
  });

  await Transaction.create({
    organizer: organizerId,
    type: "withdrawal",
    amount: Number(amount),
    fee,
    status: needsApproval ? "pending" : "pending",
    referenceId: withdrawal._id,
    metadata: { withdrawalId: withdrawal._id },
  });

  if (needsApproval) {
    await notifyWithdrawalStatus(
      app,
      withdrawal,
      "withdrawal_submitted",
      `Withdrawal of ₦${numericAmount.toLocaleString()} submitted and waiting for admin approval.`,
      "/dashboard/transactions",
    );
    try {
      await sendWithdrawalEmail(
        organizer,
        "Withdrawal waiting for admin approval",
        `<p>Your withdrawal of <strong>₦${numericAmount.toLocaleString()}</strong> is waiting for admin approval.</p>`,
      );
    } catch (error) {
      console.warn("Withdrawal approval email failed:", error.message);
    }
    return { withdrawal, requiresAdminApproval: true };
  }

  await notifyWithdrawalStatus(
    app,
    withdrawal,
    "withdrawal_processing",
    `Withdrawal of ₦${numericAmount.toLocaleString()} submitted and is being processed.`,
    "/dashboard/transactions",
  );

  try {
    const initiated = await initiateWithdrawalTransfer({
      withdrawalId: withdrawal._id,
      actorId: organizerId,
      app,
      note: "automatic-withdrawal",
      reserveFunds: true,
    });
    return { withdrawal: initiated, requiresAdminApproval: false };
  } catch (error) {
    return { withdrawal, requiresAdminApproval: false, error };
  }
};

const approveWithdrawal = async ({ withdrawalId, actorId, app = null, note = "admin-approval" }) => {
  const withdrawal = await Withdrawal.findById(withdrawalId).populate("organizer");
  if (!withdrawal) throw new Error("Withdrawal not found");

  const currentStatus = normalizeLegacyWithdrawalStatus(withdrawal.status);
  if (![WITHDRAWAL_STATUS.PENDING_ADMIN_APPROVAL, WITHDRAWAL_STATUS.FAILED].includes(currentStatus)) {
    throw new Error("Only withdrawals waiting for admin approval or failed withdrawals can be approved");
  }

  await notifyWithdrawalStatus(
    app,
    withdrawal,
    "withdrawal_approved",
    `Your withdrawal of ₦${Number(withdrawal.amount || 0).toLocaleString()} was approved.`,
    "/dashboard/transactions",
  );

  await initiateWithdrawalTransfer({
    withdrawalId: withdrawal._id,
    actorId,
    app,
    note,
    reserveFunds: true,
  });

  return Withdrawal.findById(withdrawal._id).populate("organizer");
};

module.exports = {
  WITHDRAWAL_STATUS,
  getApprovalMode,
  requestWithdrawal,
  approveWithdrawal,
  initiateWithdrawalTransfer,
  finalizeWithdrawalFromWebhook,
  getWithdrawalByReference,
  updateTransactionForWithdrawal,
  updateOrganizerSuccessfulWithdrawalState,
  escapeRegex,
};
