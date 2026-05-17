const test = require("node:test");
const assert = require("node:assert/strict");
const {
  computeTicketOrderTotal,
  amountsMatch,
  resolveTicketUnitPrice,
} = require("../utils/ticketPricing");

const sampleEvent = {
  isFree: false,
  pricing: [
    { type: "Regular", price: 5000 },
    { type: "VIP", price: 15000 },
  ],
};

test("resolveTicketUnitPrice returns tier price", () => {
  assert.equal(resolveTicketUnitPrice(sampleEvent, "VIP"), 15000);
});

test("computeTicketOrderTotal multiplies quantity", () => {
  const order = computeTicketOrderTotal(sampleEvent, {
    pricingType: "Regular",
    quantity: 3,
  });
  assert.equal(order.quantity, 3);
  assert.equal(order.totalNaira, 15000);
  assert.equal(order.totalKobo, 1500000);
});

test("amountsMatch compares kobo within tolerance", () => {
  assert.equal(amountsMatch(1500000, 1500000), true);
  assert.equal(amountsMatch(1499999, 1500000), false);
});
