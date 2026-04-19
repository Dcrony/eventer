/** Net amount credited to organizer for a ticket sale (after platform fee). */
export function ticketNetToOrganizer(tx) {
  if (!tx || tx.type !== "ticket") return Number(tx?.amount) || 0;
  return Math.max(0, (Number(tx.amount) || 0) - (Number(tx.fee) || 0));
}
