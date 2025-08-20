const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getMyTickets } = require("../controllers/ticketController");

console.log("authMiddleware:", typeof authMiddleware);
console.log("getMyTickets:", typeof getMyTickets);

router.get("/my-tickets", authMiddleware, getMyTickets);

module.exports = router;
