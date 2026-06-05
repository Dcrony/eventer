const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/organizer/balances', authMiddleware, financeController.getOrganizerSummary);
router.get('/organizer/payouts', authMiddleware, financeController.getPayoutHistory);

module.exports = router;
