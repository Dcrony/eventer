const express = require("express");
const router = express.Router();
const Donation = require("../models/Donation");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const { initiateDonation, verifyDonation } = require("../controllers/donationController");

router.post("/", initiateDonation);
router.get("/verify", verifyDonation);

router.get("/", authMiddleware, authorizeRoles("admin"), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [donations, total] = await Promise.all([
      Donation.find()
        .select("name amount status createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Donation.countDocuments(),
    ]);

    res.json({
      donations,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch donations" });
  }
});

module.exports = router;