// routes/ticketRoutes.js
const express = require("express");
const router = express.Router();

const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const { createTicket, getMyTickets, validateTicket, getEventTickets, refundTicket, resendTicketEmail, manualCheckIn } = require("../controllers/ticketController");

router.get("/my-tickets", authMiddleware, getMyTickets);
router.post("/create", authMiddleware, createTicket);

router.get(
  "/validate/:ticketId",
  authMiddleware,
  authorizeRoles("organizer", "admin"),
  validateTicket
);

// Organizer routes
router.get(
  "/event/:eventId",
  authMiddleware,
  authorizeRoles("organizer", "admin"),
  getEventTickets
);

router.post(
  "/:ticketId/refund",
  authMiddleware,
  authorizeRoles("organizer", "admin"),
  refundTicket
);

router.post(
  "/:ticketId/resend",
  authMiddleware,
  authorizeRoles("organizer", "admin"),
  resendTicketEmail
);

router.post(
  "/:ticketId/checkin",
  authMiddleware,
  authorizeRoles("organizer", "admin"),
  manualCheckIn
);

module.exports = router;
