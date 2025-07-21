const express = require('express');
const router = express.Router();
const { initiatePayment, verifyPayment } = require('../controllers/paymentController');
const auth = require('../middleware/authMiddleware');

router.post('/initiate', auth,  initiatePayment);
router.get('/verify', verifyPayment);


module.exports = router;
