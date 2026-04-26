// routes/ticketRoutes.js
const express = require("express");
const router = express.Router();

const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const { createTicket, getMyTickets, validateTicket } = require("../controllers/ticketController");

router.get("/my-tickets", authMiddleware, getMyTickets);
router.post("/create", authMiddleware, createTicket);

router.get(
  "/validate/:ticketId",
  authMiddleware,
  authorizeRoles("organizer", "admin"),
  validateTicket
);

module.exports = router;
