const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getMyTickets } = require('../controllers/ticketController');

router.get('/my-tickets', auth, getMyTickets);


module.exports = router;
