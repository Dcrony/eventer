const Payout = require('../models/Payout');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { capOrganizerAvailableBalance } = require('../utils/organizerBalance');

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

  const reconciledAvailableBalance = await capOrganizerAvailableBalance(organizerId, rawAvailable);

  return {
    rawAvailableBalance: rawAvailable,
    availableBalance: reconciledAvailableBalance,
    reconciledAvailableBalance,
    pendingReleaseBalance: pending,
    escrowBalance: escrow,
    releasedRevenue: released,
    refundedRevenue: refunded,
  };
}

async function getPayoutHistory(organizerId, page = 1, limit = 20) {
  const skip = (Number(page) - 1) * Number(limit);
  const items = await Payout.find({ organizer: organizerId }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
  const total = await Payout.countDocuments({ organizer: organizerId });
  return { items, pagination: { page: Number(page), limit: Number(limit), total } };
}

module.exports = { getOrganizerBalances, getPayoutHistory };
