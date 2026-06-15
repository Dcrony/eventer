const mongoose = require("mongoose");
const Withdrawal = require("../models/Withdrawal");
const Payout = require("../models/Payout");

/**
 * Net ticket proceeds minus completed withdrawals (ignores stored User.availableBalance).
 */
async function getReconciledOrganizerAvailable(userId) {
  const oid = new mongoose.Types.ObjectId(userId);

  const withdrawalTotals = await Withdrawal.aggregate([
    { $match: { organizer: oid, status: "completed" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalWithdrawn = withdrawalTotals[0]?.total || 0;

  const releasedTotals = await Payout.aggregate([
    { $match: { organizer: oid, state: { $in: ["released", "completed"] } } },
    { $group: { _id: null, total: { $sum: "$netAmount" } } },
  ]);
  const totalReleasedNet = releasedTotals[0]?.total || 0;

  return Math.max(0, totalReleasedNet - totalWithdrawn);
}

/** Caps stored balance so UI and withdrawals never exceed ticket-net minus completed withdrawals. */
async function capOrganizerAvailableBalance(userId, rawAvailable) {
  const reconciled = await getReconciledOrganizerAvailable(userId);
  return Math.min(Number(rawAvailable) || 0, reconciled);
}

module.exports = { getReconciledOrganizerAvailable, capOrganizerAvailableBalance };
