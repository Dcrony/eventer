// routes/ticketRoutes.js
const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleware");
const { createTicket, getMyTickets, validateTicket, getEventTickets, refundTicket, resendTicketEmail, manualCheckIn } = require("../controllers/ticketController");
const { recordScan, syncCheckins, getActivity } = require("../controllers/checkinController");

router.get("/my-tickets", authMiddleware, getMyTickets);
router.post("/create", authMiddleware, createTicket);

router.get(
  "/validate/:ticketId",
  authMiddleware,
  validateTicket
);

// Organizer routes
router.get(
  "/event/:eventId",
  authMiddleware,
  getEventTickets
);

router.post(
  "/:ticketId/refund",
  authMiddleware,
  refundTicket
);

router.post(
  "/:ticketId/resend",
  authMiddleware,
  resendTicketEmail
);

router.post(
  "/:ticketId/checkin",
  authMiddleware,
  manualCheckIn
);

// Scan / activity endpoints
router.post(
  "/event/:eventId/scan",
  authMiddleware,
  recordScan
);

router.post(
  "/event/:eventId/sync",
  authMiddleware,
  syncCheckins
);

router.get(
  "/event/:eventId/scan-activity",
  authMiddleware,
  getActivity
);

module.exports = router;
