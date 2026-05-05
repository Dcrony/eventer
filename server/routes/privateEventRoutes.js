const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireFeature } = require("../middleware/requirePro");
const { getPrivateEvents } = require("../controllers/proFeatureController");

const router = express.Router();

router.get("/", authMiddleware, requireFeature("PRIVATE_EVENTS"), getPrivateEvents);

module.exports = router;
