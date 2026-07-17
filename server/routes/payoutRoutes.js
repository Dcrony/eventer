const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const payoutController = require("../controllers/payoutController");

// Organizer routes
router.post("/request", authMiddleware, authorizeRoles("organizer", "admin", "super_admin", "finance_admin"), payoutController.requestEarlyPayout);

// Admin: list payouts
router.get("/admin/queue", authMiddleware, authorizeRoles("admin", "super_admin", "finance_admin"), payoutController.listPayouts);
router.post("/admin/process", authMiddleware, authorizeRoles("admin", "super_admin", "finance_admin"), payoutController.adminRunPayoutProcessing);
router.get("/admin/settings", authMiddleware, authorizeRoles("admin", "super_admin", "finance_admin"), payoutController.getPayoutSettings);
router.put("/admin/settings", authMiddleware, authorizeRoles("admin", "super_admin", "finance_admin"), payoutController.updatePayoutSettings);
router.get("/admin/:id", authMiddleware, authorizeRoles("admin", "super_admin", "finance_admin"), payoutController.getPayout);
router.post("/admin/:id/action", authMiddleware, authorizeRoles("admin", "super_admin", "finance_admin"), payoutController.adminUpdatePayout);

module.exports = router;
