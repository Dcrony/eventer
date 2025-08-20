const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { getMyTickets } = require("../controllers/ticketController");

// Get all tickets purchased by the logged-in user
router.get("/my-tickets", authMiddleware, getMyTickets);

module.exports = router;
