const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { rateLimitByUser } = require("../middleware/rateLimitByUser");
const {
  getCurrentPlan,
  getBillingHistory,
  initializeBilling,
  upgradePlan,
  verifyBilling,
  handleBillingRedirect,
} = require("../controllers/billingController");
const { handlePaystackWebhook } = require("../controllers/webhookController");

const router = express.Router();
const billingWriteLimiter = rateLimitByUser({
  windowMs: 5 * 60 * 1000,
  max: 10,
  keyPrefix: "billing-write",
  message: "Too many billing requests. Please try again shortly.",
});

router.get("/current-plan", authMiddleware, getCurrentPlan);
router.get("/history", authMiddleware, getBillingHistory);
router.post("/initialize", authMiddleware, billingWriteLimiter, initializeBilling);
router.post("/upgrade", authMiddleware, billingWriteLimiter, upgradePlan);
router.get("/verify", verifyBilling);
router.get("/verify/:reference", verifyBilling);
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handlePaystackWebhook,
);
router.get("/redirect/:reference", handleBillingRedirect);

module.exports = router;
