const express = require("express");
const router = express.Router();

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

const axios = require("axios");

// ─── Admin role shorthand ────────────────────────────────────────────────────
const ADMIN_ROLES = [
  "super_admin", "admin", "moderator", "finance_admin", "support_admin",
];

// ─── Organizer-accessible roles ──────────────────────────────────────────────
// Organizers and users can access earnings + payout routes.
// Admin roles are included so admins can also access them while impersonating.
const ORGANIZER_ROLES = [...ADMIN_ROLES, "organizer", "user"];

/*
|--------------------------------------------------------------------------
| BANKS  (public-ish — no role restriction, just auth)
|--------------------------------------------------------------------------
*/
router.get("/banks", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.paystack.co/bank?country=nigeria",
      {
        headers: {
          Authorization: `Bearer ${
            process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET
          }`,
        },
      },
    );
    res.json(response.data.data);
  } catch {
    res.status(500).json({ message: "Failed to fetch banks" });
  }
});

/*
|--------------------------------------------------------------------------
| ORGANIZER ROUTES
|--------------------------------------------------------------------------
*/

// ✅ Fixed: added "organizer" and "user" to authorizeRoles
router.get(
  "/organizer/earnings",
  authMiddleware,
  authorizeRoles(...ORGANIZER_ROLES),
  getOrganizerEarnings,
);

router.get(
  "/organizer/transactions",
  authMiddleware,
  authorizeRoles(...ORGANIZER_ROLES),
  getOrganizerTransactions,
);

router.post(
  "/organizer/withdraw",
  authMiddleware,
  authorizeRoles(...ORGANIZER_ROLES),
  requestWithdrawal,
);

// Payout account routes — organizer-accessible
router.post(
  "/organizer/payout/connect",
  authMiddleware,
  authorizeRoles(...ORGANIZER_ROLES),
  connectPayoutAccount,
);

router.get(
  "/organizer/payout/account",
  authMiddleware,
  authorizeRoles(...ORGANIZER_ROLES),
  getPayoutAccount,
);

router.put(
  "/organizer/payout/account",
  authMiddleware,
  authorizeRoles(...ORGANIZER_ROLES),
  updatePayoutAccount,
);

router.delete(
  "/organizer/payout/account",
  authMiddleware,
  authorizeRoles(...ORGANIZER_ROLES),
  disconnectPayoutAccount,
);

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
| ⚠️  Static paths (/monthly, /analytics, /export) MUST come before /:id
|    to prevent Express from treating them as the :id param.
|--------------------------------------------------------------------------
*/
const FINANCE_ROLES = ["super_admin", "admin", "finance_admin"];

router.get(
  "/admin/withdrawals/monthly",
  authMiddleware,
  authorizeRoles(...FINANCE_ROLES), 
  getMonthlyWithdrawalTrend,
);

router.get(
  "/admin/withdrawals/analytics",
  authMiddleware,
  authorizeRoles(...FINANCE_ROLES),
  getWithdrawalAnalytics,
);

router.get(
  "/admin/withdrawals/export",
  authMiddleware,
  authorizeRoles(...FINANCE_ROLES),
  exportAdminWithdrawals,
);

// ⚠️  /:id MUST come after all static /admin/withdrawals/* routes
router.patch(
  "/admin/withdrawals/:id",
  authMiddleware,
  authorizeRoles(...FINANCE_ROLES),
  adminUpdateWithdrawal,
);

router.get(
  "/admin/withdrawals",
  authMiddleware,
  authorizeRoles(...FINANCE_ROLES),
  getAdminWithdrawals,
);

module.exports = router;