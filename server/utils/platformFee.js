/**
 * Platform take on ticket sales (buyer still pays full price; organizer receives net).
 * Override with PLATFORM_TICKET_FEE_PERCENT in .env (default 10).
 */
const PLATFORM_TICKET_FEE_PERCENT = Number(
  process.env.PLATFORM_TICKET_FEE_PERCENT ?? 10
);

function clampPercent(p) {
  if (Number.isNaN(p) || p < 0) return 0;
  if (p > 100) return 100;
  return p;
}

/**
 * @param {number} grossNaira - Total paid by buyer (same currency as balance, e.g. NGN)
 * @returns {{ gross: number, platformFee: number, netToOrganizer: number, percent: number }}
 */
function splitTicketSaleForOrganizer(grossNaira) {
  const gross = Number(grossNaira) || 0;
  const pct = clampPercent(PLATFORM_TICKET_FEE_PERCENT);
  const platformFee = Math.round((gross * pct) / 100);
  const netToOrganizer = gross - platformFee;
  return {
    gross,
    platformFee,
    netToOrganizer,
    percent: pct,
  };
}

module.exports = {
  splitTicketSaleForOrganizer,
  getPlatformTicketFeePercent: () => clampPercent(PLATFORM_TICKET_FEE_PERCENT),
};
