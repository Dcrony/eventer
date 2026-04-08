const express = require("express");
const router = express.Router();

const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const {
  requestWithdrawal,
  getOrganizerTransactions,
  adminUpdateWithdrawal,
  getAdminWithdrawals,
  getWithdrawalAnalytics,
  getMonthlyWithdrawalTrend,
} = require("../controllers/withdrawalController");

const {
  authMiddleware,
  authorizeRoles,
} = require("../middleware/authMiddleware");

/*
|--------------------------------------------------------------------------
| ORGANIZER ROUTES
|--------------------------------------------------------------------------
*/

router.post(
  "/organizer/withdraw",
  authMiddleware,
  authorizeRoles("organizer", "admin"),
  requestWithdrawal,
);

router.get("/organizer/transactions", authMiddleware, getOrganizerTransactions);

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/

router.patch(
  "/admin/withdrawals/:id",
  authMiddleware,
  authorizeRoles("admin"),
  adminUpdateWithdrawal
);

router.get(
  "/admin/withdrawals",
  authMiddleware,
  authorizeRoles("admin"),
  getAdminWithdrawals
);

router.get(
  "/admin/withdrawals/monthly",
  authMiddleware,
  authorizeRoles("admin"),
  getMonthlyWithdrawalTrend
);

router.get(
  "/admin/withdrawals/analytics",
  authMiddleware,
  authorizeRoles("admin"),
  getWithdrawalAnalytics
);

const axios = require("axios");

router.get("/banks", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.paystack.co/bank?country=nigeria",
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET}`,
        },
      }
    );

    res.json(response.data.data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch banks" });
  }
});



module.exports = router;
