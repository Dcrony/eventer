// routes/statRoutes.js
const express = require("express");
const router = express.Router();
const {authMiddleware} = require("../middleware/authMiddleware");
const { getStats } = require("../controllers/statController");

router.get("/stats", authMiddleware, getStats);

module.exports = router;
