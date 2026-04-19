const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getCurrentPlan,
  getBillingHistory,
  upgradePlan,
} = require("../controllers/billingController");

const router = express.Router();

router.get("/current-plan", authMiddleware, getCurrentPlan);
router.get("/history", authMiddleware, getBillingHistory);
router.post("/upgrade", authMiddleware, upgradePlan);

module.exports = router;
