const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const payoutController = require("../controllers/payoutController");

// Admin: list payouts
router.get("/admin/queue", authMiddleware, authorizeRoles("admin", "super_admin", "finance_admin"), payoutController.listPayouts);
router.get("/admin/:id", authMiddleware, authorizeRoles("admin", "super_admin", "finance_admin"), payoutController.getPayout);
router.post("/admin/:id/action", authMiddleware, authorizeRoles("admin", "super_admin", "finance_admin"), payoutController.adminUpdatePayout);

module.exports = router;
