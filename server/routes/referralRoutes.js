

const express = require("express");
const router  = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  trackReferralClick,
  recordReferralConversion,
  getEventReferralStats,
  getReferralLeaderboard,
} = require("../controllers/referralController");

router.post("/track",   trackReferralClick);
router.post("/convert", recordReferralConversion);
router.get("/:eventId/stats",       authMiddleware, getEventReferralStats);
router.get("/:eventId/leaderboard", authMiddleware, getReferralLeaderboard);

module.exports = router;