const express = require("express");
const router = express.Router();
const {
  requestWithdrawal,
  getOrganizerTransactions,
} = require("../controllers/withdrawalController");

const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");


router.post("/withdraw", authMiddleware, requestWithdrawal);
router.get("/transactions", authMiddleware, getOrganizerTransactions);

module.exports = router;