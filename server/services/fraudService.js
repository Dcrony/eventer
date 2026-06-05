const FraudFlag = require('../models/FraudFlag');
const Transaction = require('../models/Transaction');
const Payout = require('../models/Payout');
const Ticket = require('../models/Ticket');


async function assessPayoutRisk(payout) {
  try {
    const score = { reasons: [], value: 0 };
    if ((payout.netAmount || 0) > 500000) {
      score.value += 50;
      score.reasons.push("High payout amount");
    }
    if ((payout.tickets || []).length > 20) {
      score.value += 20;
      score.reasons.push("Large number of tickets in payout");
    }
    return score;
  } catch (e) {
    return { value: 0, reasons: [] };
  }
}



async function flagOrganizer(organizerId, reason, score = 50, notes = '') {
  return FraudFlag.create({ targetType: 'organizer', targetId: organizerId, reason, score, notes });
}

async function clearFlag(flagId, resolvedBy = null) {
  return FraudFlag.findByIdAndUpdate(flagId, { resolved: true, resolvedAt: new Date(), resolvedBy }, { new: true });
}

async function getFlagsForOrganizer(organizerId) {
  return FraudFlag.find({ targetType: 'organizer', targetId: organizerId }).sort({ createdAt: -1 }).lean();
}

async function isOrganizerFlagged(organizerId) {
  const flag = await FraudFlag.findOne({ targetType: 'organizer', targetId: organizerId, resolved: false });
  return Boolean(flag);
}

// Basic heuristic: if refunded transactions exceed threshold percentage in last N days
async function detectRefundSpike(organizerId, days = 14, pctThreshold = 0.2) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const totalAgg = await Transaction.aggregate([
    { $match: { organizer: organizerId, createdAt: { $gte: since }, type: { $in: ['ticket'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const refundedAgg = await Transaction.aggregate([
    { $match: { organizer: organizerId, createdAt: { $gte: since }, status: 'refunded' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const total = totalAgg[0]?.total || 0;
  const refunded = refundedAgg[0]?.total || 0;
  if (total <= 0) return { flagged: false, total, refunded, ratio: 0 };
  const ratio = refunded / total;
  const flagged = ratio >= pctThreshold;
  if (flagged) {
    await flagOrganizer(organizerId, `Refund spike: ${Math.round(ratio * 100)}% over last ${days} days`, Math.round(ratio * 100));
  }
  return { flagged, total, refunded, ratio };
}

async function getFraudSummary(days = 30) {
  // Return counts of flags, recent high-risk payouts, and refund spike summary
  const since = new Date();
  since.setDate(since.getDate() - days);

  const flagsCount = await FraudFlag.countDocuments({ resolved: false });
  const recentFlags = await FraudFlag.find({ createdAt: { $gte: since } }).limit(20).sort({ createdAt: -1 }).lean();

  const suspiciousPayouts = await Payout.find({ state: { $in: ['frozen', 'under_review'] } }).limit(20).sort({ createdAt: -1 }).lean();

  return { flagsCount, recentFlags, suspiciousPayouts };
}

// ... rest of your full fraudService functions ...

module.exports = {
  flagOrganizer,
  clearFlag,
  getFlagsForOrganizer,
  isOrganizerFlagged,
  detectRefundSpike,
  getFraudSummary,
  assessPayoutRisk,  // ← add this to the full service's exports
};