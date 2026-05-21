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
  exportAdminWithdrawals,
} = require("../controllers/withdrawalController");
const {
  connectPayoutAccount,
  getPayoutAccount,
  updatePayoutAccount,
  disconnectPayoutAccount,
} = require("../controllers/payoutController");
const { getOrganizerEarnings } = require("../controllers/statController");

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
  authorizeRoles("super_admin", "admin", "moderator", "finance_admin", "support_admin"),
  requestWithdrawal,
);

router.get("/organizer/transactions", authMiddleware, getOrganizerTransactions);

router.get(
  "/organizer/earnings",
  authMiddleware,
  authorizeRoles("super_admin", "admin", "moderator", "finance_admin", "support_admin"),
  getOrganizerEarnings
);

// Payout Account Routes
router.post(
  "/organizer/payout/connect",
  authMiddleware,
  authorizeRoles("super_admin", "admin", "moderator", "finance_admin", "support_admin"),
  connectPayoutAccount,
);

router.get(
  "/organizer/payout/account",
  authMiddleware,
  authorizeRoles("super_admin", "admin", "moderator", "finance_admin", "support_admin"),
  getPayoutAccount,
);

router.put(
  "/organizer/payout/account",
  authMiddleware,
  authorizeRoles("super_admin", "admin", "moderator", "finance_admin", "support_admin"),
  updatePayoutAccount,
);

router.delete(
  "/organizer/payout/account",
  authMiddleware,
  authorizeRoles("super_admin", "admin", "moderator", "finance_admin", "support_admin"),
  disconnectPayoutAccount,
);

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/

router.patch(
  "/admin/withdrawals/:id",
  authMiddleware,
  authorizeRoles("super_admin", "admin", "finance_admin"),
  adminUpdateWithdrawal
);

router.get(
  "/admin/withdrawals",
  authMiddleware,
  authorizeRoles("super_admin", "admin", "finance_admin"),
  getAdminWithdrawals
);

router.get(
  "/admin/withdrawals/monthly",
  authMiddleware,
  authorizeRoles("super_admin", "admin", "finance_admin"),
  getMonthlyWithdrawalTrend
);

router.get(
  "/admin/withdrawals/analytics",
  authMiddleware,
  authorizeRoles("super_admin", "admin", "finance_admin"),
  getWithdrawalAnalytics
);

router.get(
  "/admin/withdrawals/export",
  authMiddleware,
  authorizeRoles("super_admin", "admin", "finance_admin"),
  exportAdminWithdrawals
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
