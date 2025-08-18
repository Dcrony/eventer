// routes/statRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getStats } = require("../controllers/statController");

router.get("/stats", auth, getStats);

module.exports = router;
