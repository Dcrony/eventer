// routes/statRoutes.js
const express = require("express");
const router = express.Router();
const { getStats } = require("../controllers/statController");
const auth = require("../middleware/authMiddleware");

router.get("/stats", auth, getStats);

module.exports = router;
