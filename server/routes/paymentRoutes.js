const express = require('express');
const router = express.Router();
const { initiatePayment, verifyPayment } = require('../controllers/paymentController');
const {authMiddleware} = require('../middleware/authMiddleware');

router.post('/initiate', authMiddleware,  initiatePayment);
router.get('/verify', verifyPayment);


module.exports = router;
