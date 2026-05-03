const express = require("express");
const router = express.Router();
const { initiateDonation, verifyDonation } = require("../controllers/donationController");

// Initiate donation payment
router.post("/", initiateDonation);

// Verify donation payment (callback from Paystack)
router.get("/verify", verifyDonation);

router.get("/", async (req, res) => {
  const donations = await Donation.find().sort({ createdAt: -1 });
  res.json(donations);
});

module.exports = router;