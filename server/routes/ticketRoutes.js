// routes/ticketRoutes.js
const express = require("express");
const router = express.Router();

const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const { getMyTickets, validateTicket } = require("../controllers/ticketController");

router.get("/my-tickets", authMiddleware, getMyTickets);

router.get(
  "/validate/:ticketId",
  authMiddleware,
  authorizeRoles("organizer", "admin"),
  validateTicket
);

module.exports = router;
