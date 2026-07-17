const Payout = require('../models/Payout');
const User = require('../models/User');
const { capOrganizerAvailableBalance } = require('../utils/organizerBalance');
const smartPayoutService = require('../services/smartPayoutService');

async function getOrganizerBalances(organizerId) {
  const organizer = await User.findById(organizerId).lean();
  if (!organizer) throw new Error('Organizer not found');

  const rawAvailable = Number(organizer.availableBalance || 0);
  const pending = Number(organizer.pendingBalance || 0);
  // escrow: compute sum of payouts in state pending/under_review/frozen
  const escrowAgg = await Payout.aggregate([
    { $match: { organizer: organizerId, state: { $in: ['pending','under_review','frozen'] } } },
    { $group: { _id: null, total: { $sum: '$netAmount' } } },
  ]);
  const escrow = escrowAgg[0]?.total || 0;

  // released revenue = sum of netAmount where state == released
  const releasedAgg = await Payout.aggregate([
    { $match: { organizer: organizerId, state: 'released' } },
    { $group: { _id: null, total: { $sum: '$netAmount' } } },
  ]);
  const released = releasedAgg[0]?.total || 0;

  // refunded revenue = sum of grossAmount where state == refunded
  const refundedAgg = await Payout.aggregate([
    { $match: { organizer: organizerId, state: 'refunded' } },
    { $group: { _id: null, total: { $sum: '$grossAmount' } } },
  ]);
  const refunded = refundedAgg[0]?.total || 0;

  const payoutTotalsAgg = await Payout.aggregate([
    { $match: { organizer: organizerId } },
    {
      $group: {
        _id: null,
        totalPayouts: { $sum: 1 },
        pendingPayouts: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
        processingPayouts: { $sum: { $cond: [{ $eq: ['$status', 'PROCESSING'] }, 1, 0] } },
        paidPayouts: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] } },
        failedPayouts: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
        totalPaidAmount: { $sum: { $cond: [{ $in: ['$state', ['released', 'completed']] }, '$netAmount', 0] } },
        pendingHeldAmount: { $sum: { $cond: [{ $in: ['$state', ['pending', 'processing', 'scheduled', 'under_review']] }, '$netAmount', 0] } },
      },
    },
  ]);

  const nextAutomaticPayout = await Payout.findOne({
    organizer: organizerId,
    state: { $in: ['pending', 'scheduled'] },
    releaseAfter: { $gt: new Date() },
  })
    .sort({ releaseAfter: 1 })
    .select('releaseAfter state status netAmount payoutType')
    .lean();

  const payoutTotals = payoutTotalsAgg[0] || {};
  const effectiveOrganizerLevel = smartPayoutService.getEffectiveOrganizerLevel(organizer);
  const policy = smartPayoutService.getOrganizerPayoutPolicy({
    organizerLevel: effectiveOrganizerLevel,
    isVerified: organizer.isVerified,
    earlyPayoutEnabled: organizer.earlyPayoutEnabled,
  });
  const availableEarlyPayout = Math.max(0, Math.round((payoutTotals.pendingHeldAmount || 0) * (policy.allowedEarlyPercent / 100)));

  const reconciledAvailableBalance = await capOrganizerAvailableBalance(organizerId, rawAvailable);

  return {
    rawAvailableBalance: rawAvailable,
    availableBalance: reconciledAvailableBalance,
    reconciledAvailableBalance,
    pendingReleaseBalance: pending,
    escrowBalance: escrow,
    releasedRevenue: released,
    refundedRevenue: refunded,
    totalPaid: Number(payoutTotals.totalPaidAmount || 0),
    totalPayouts: Number(payoutTotals.totalPayouts || 0),
    pendingPayouts: Number(payoutTotals.pendingPayouts || 0),
    processingPayouts: Number(payoutTotals.processingPayouts || 0),
    paidPayouts: Number(payoutTotals.paidPayouts || 0),
    failedPayouts: Number(payoutTotals.failedPayouts || 0),
    remainingHeldBalance: Number(payoutTotals.pendingHeldAmount || 0),
    availableEarlyPayout,
    nextAutomaticPayoutAt: nextAutomaticPayout?.releaseAfter || null,
    organizerLevel: effectiveOrganizerLevel,
    trustScore: Number(organizer.trustScore || 0),
    earlyPayoutEnabled: Boolean(organizer.earlyPayoutEnabled),
  };
}

async function getPayoutHistory(organizerId, page = 1, limit = 20) {
  const skip = (Number(page) - 1) * Number(limit);
  const items = await Payout.find({ organizer: organizerId }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
  const total = await Payout.countDocuments({ organizer: organizerId });
  return { items, pagination: { page: Number(page), limit: Number(limit), total } };
}

module.exports = { getOrganizerBalances, getPayoutHistory };
