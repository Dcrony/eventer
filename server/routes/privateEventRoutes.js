const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requirePro } = require("../middleware/requirePro");
const { getPrivateEvents } = require("../controllers/proFeatureController");

const router = express.Router();

router.get("/", authMiddleware, requirePro, getPrivateEvents);

module.exports = router;
