const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path')

const {
  getAllEvents,
  purchaseTicket,
  toggleLiveStream,
  // getStats,
} = require("../controllers/eventController");
const { getMyTickets } = require("../controllers/ticketController");
const auth = require("../middleware/authMiddleware");
const {
  getMyEvents,
  updateEvent,
  deleteEvent,
  getEventBuyers,
  getEventById,
} = require("../controllers/eventController");



const Event = require('../models/Event');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/event_image');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Route to create event with image upload
router.post('/create', upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, date, time, location, ticketPrice, totalTickets, streamType, streamURL } = req.body;
    const imagePath = req.file ? req.file.filename : '';

    const newEvent = new Event({
      title,
      description,
      category,
      date,
      time,
      location,
      image: imagePath,
      ticketPrice,
      totalTickets,
      liveStream: {
        isLive: false,
        streamType,
        streamURL,
      },
      createdBy: req.user.id // ✅ from auth middleware
    });

    await newEvent.save();
    res.status(201).json({ message: 'Event created', event: newEvent });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

router.get("/", getAllEvents); // public route
router.post("/buy", auth, purchaseTicket);
router.patch("/toggle-live", auth, toggleLiveStream);
router.get("/my-tickets", auth, getMyTickets);
router.get("/my-events", auth, getMyEvents);
router.get("/:id", getEventById);
router.put("/update/:eventId", auth, updateEvent);
router.delete("/delete/:eventId", auth, deleteEvent);
router.get("/buyers/:eventId", auth, getEventBuyers);
// router.get("/stats", auth, getStats);
// events route
router.get("/events", async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "username profilePic"); // only get username & profilePic
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});




module.exports = router;
