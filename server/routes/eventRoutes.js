const express = require("express");
const router = express.Router();
const {
  createEvent,
  getAllEvents,
  purchaseTicket,
  toggleLiveStream,
} = require("../controllers/eventController");
const { getMyTickets } = require("../controllers/ticketController");
const authMiddleware = require("../middleware/authMiddleware");
const auth = require("../middleware/authMiddleware");
const {
  getMyEvents,
  updateEvent,
  deleteEvent,
  getEventBuyers,
  getEventById,
  getStats,
} = require("../controllers/eventController");




router.post("/create", authMiddleware, createEvent);
router.get("/", getAllEvents); // public route
router.post("/buy", authMiddleware, purchaseTicket);
router.patch("/toggle-live", auth, toggleLiveStream);
router.get("/my-tickets", auth, getMyTickets);
router.get("/my-events", auth, getMyEvents);
router.get("/:id", getEventById);
router.put("/update/:eventId", auth, updateEvent);
router.delete("/delete/:eventId", auth, deleteEvent);
router.get("/buyers/:eventId", authMiddleware, getEventBuyers);
router.get("/stats", authMiddleware, getStats);



module.exports = router;
