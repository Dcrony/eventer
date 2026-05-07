const express = require("express");
const router = express.Router();
const Donation = require("../models/Donation"); // ← was missing
const { initiateDonation, verifyDonation } = require("../controllers/donationController");

router.post("/", initiateDonation);
router.get("/verify", verifyDonation);

router.get("/", async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch donations" });
  }
});

module.exports = router;