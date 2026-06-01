/**
 * Simple fraud service placeholder. In production, replace with real signals / ML.
 */
module.exports = {
  async assessPayoutRisk(payout) {
    try {
      const score = { reasons: [], value: 0 };
      // High amount heuristic
      if ((payout.netAmount || 0) > 500000) { // > ₦500k
        score.value += 50;
        score.reasons.push("High payout amount");
      }
      // Many tickets heuristic
      if ((payout.tickets || []).length > 20) {
        score.value += 20;
        score.reasons.push("Large number of tickets in payout");
      }
      // default: low risk
      return score;
    } catch (e) {
      return { value: 0, reasons: [] };
    }
  },
};
