const mongoose = require("mongoose");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const Withdrawal = require("../models/Withdrawal");
const { getPlatformTicketFeePercent } = require("./platformFee");

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

  const events = await Event.find({ createdBy: userId }).lean();
  const eventIds = events.map((e) => e._id);
  const tickets =
    eventIds.length === 0 ? [] : await Ticket.find({ event: { $in: eventIds } }).lean();
  const grossTicketSales = tickets.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const pct = getPlatformTicketFeePercent();
  const commission = Math.round((grossTicketSales * pct) / 100);
  const netAfterSalesCommission = grossTicketSales - commission;
  return Math.max(0, netAfterSalesCommission - totalWithdrawn);
}

/** Caps stored balance so UI and withdrawals never exceed ticket-net minus completed withdrawals. */
async function capOrganizerAvailableBalance(userId, rawAvailable) {
  const reconciled = await getReconciledOrganizerAvailable(userId);
  return Math.min(Number(rawAvailable) || 0, reconciled);
}

module.exports = { getReconciledOrganizerAvailable, capOrganizerAvailableBalance };
