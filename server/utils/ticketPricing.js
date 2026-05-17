/**
 * Server-side ticket price calculation — never trust client amount.
 */

function resolveTicketUnitPrice(event, pricingType) {
  if (!event) {
    throw new Error("Event not found");
  }

  if (event.isFree) {
    return 0;
  }

  const tiers = Array.isArray(event.pricing) ? event.pricing : [];
  if (tiers.length === 0) {
    return 0;
  }

  const type = String(pricingType || "").trim();
  if (type) {
    const match = tiers.find((p) => p.type === type);
    if (match) {
      return Math.max(0, Number(match.price) || 0);
    }
  }

  return Math.max(0, Number(tiers[0].price) || 0);
}

function computeTicketOrderTotal(event, { pricingType, quantity }) {
  const qty = Math.max(1, Math.min(50, parseInt(quantity, 10) || 1));
  const unitPrice = resolveTicketUnitPrice(event, pricingType);
  const totalNaira = unitPrice * qty;

  return {
    quantity: qty,
    unitPrice,
    totalNaira,
    totalKobo: Math.round(totalNaira * 100),
    pricingType: pricingType || event.pricing?.[0]?.type || "Standard",
  };
}

function amountsMatch(paidKobo, expectedKobo, toleranceKobo = 0) {
  const paid = Math.round(Number(paidKobo) || 0);
  const expected = Math.round(Number(expectedKobo) || 0);
  return Math.abs(paid - expected) <= toleranceKobo;
}

module.exports = {
  resolveTicketUnitPrice,
  computeTicketOrderTotal,
  amountsMatch,
};
