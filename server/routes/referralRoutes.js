

const express = require("express");
const router  = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { rateLimitByIp } = require("../middleware/rateLimitByIp");
const {
  trackReferralClick,
  recordReferralConversion,
  getEventReferralStats,
  getReferralLeaderboard,
} = require("../controllers/referralController");

// Rate limit referral tracking to mitigate abuse (per-IP)
router.post("/track",   rateLimitByIp({ windowMs: 60 * 60 * 1000, max: 300, keyPrefix: "ref" }), trackReferralClick);
router.post("/convert", rateLimitByIp({ windowMs: 60 * 60 * 1000, max: 300, keyPrefix: "ref" }), recordReferralConversion);
router.get("/:eventId/stats",       authMiddleware, getEventReferralStats);
router.get("/:eventId/leaderboard", authMiddleware, getReferralLeaderboard);

module.exports = router;