const test = require('node:test');
const assert = require('node:assert/strict');
const { getOrganizerPayoutPolicy, calculateEarlyPayoutAmount } = require('../services/smartPayoutService');

test('new organizers cannot request early payouts', () => {
  const policy = getOrganizerPayoutPolicy({ organizerLevel: 'NEW', isVerified: false, earlyPayoutEnabled: false });

  assert.equal(policy.allowedEarlyPercent, 0);
  assert.equal(policy.canRequestEarlyPayout, false);
});

test('verified organizers can request up to 50 percent early payout', () => {
  const policy = getOrganizerPayoutPolicy({ organizerLevel: 'VERIFIED', isVerified: true, earlyPayoutEnabled: true });

  assert.equal(policy.allowedEarlyPercent, 50);
  assert.equal(policy.canRequestEarlyPayout, true);
});

test('trusted organizers can request up to 80 percent early payout', () => {
  const policy = getOrganizerPayoutPolicy({ organizerLevel: 'TRUSTED', isVerified: true, earlyPayoutEnabled: true });

  assert.equal(policy.allowedEarlyPercent, 80);
  assert.equal(policy.canRequestEarlyPayout, true);
});

test('early payout amount is derived from eligible revenue', () => {
  assert.equal(calculateEarlyPayoutAmount(1000, 50), 500);
  assert.equal(calculateEarlyPayoutAmount(1000, 80), 800);
});
