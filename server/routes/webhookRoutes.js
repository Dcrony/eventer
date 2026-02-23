const express = require("express");
const router = express.Router();
const { handlePaystackWebhook } = require("../controllers/webhookController");

// IMPORTANT: Must use raw body for signature verification
router.post(
  "/paystack",
  express.raw({ type: "application/json" }),
  handlePaystackWebhook
);

module.exports = router;