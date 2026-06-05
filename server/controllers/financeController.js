const Transaction = require('../models/Transaction');
const Payout = require('../models/Payout');
const payoutService = require('../services/payoutService');
const fraudService = require('../services/fraudService');

exports.getOrganizerSummary = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const [summary, flags, refundSpike] = await Promise.all([
      payoutService.getOrganizerBalances(organizerId),
      fraudService.getFlagsForOrganizer(organizerId),
      fraudService.detectRefundSpike(organizerId, 14, 0.2),
    ]);

    const suspiciousPayouts = await Payout.find({
      organizer: organizerId,
      state: { $in: ['frozen', 'under_review'] },
    })
      .populate('event', 'title')
      .lean();

    const suspiciousTransactionsCount = await Transaction.countDocuments({
      organizer: organizerId,
      status: { $in: ['refunded', 'chargeback'] },
    });

    return res.json({
      success: true,
      summary,
      fraud: {
        flagCount: flags.filter((flag) => !flag.resolved).length,
        activeFlags: flags.filter((flag) => !flag.resolved),
        suspiciousPayouts: suspiciousPayouts.map((payout) => ({
          _id: payout._id,
          event: payout.event,
          state: payout.state,
          netAmount: payout.netAmount,
          reason: payout.reason,
          createdAt: payout.createdAt,
        })),
        suspiciousTransactionsCount,
        refundSpike,
      },
    });
  } catch (error) {
    console.error('getOrganizerSummary error', error);
    return res.status(500).json({ message: 'Failed to fetch finance summary' });
  }
};

exports.getPayoutHistory = async (req, res) => {
  try {
    const organizerId = req.user._id;

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Payout.find({ organizer: organizerId }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Payout.countDocuments({ organizer: organizerId }),
    ]);

    return res.json({
      success: true,
      payouts: items,
      history: items,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (error) {
    console.error('getPayoutHistory error', error);
    return res.status(500).json({ message: 'Failed to fetch payout history' });
  }
};