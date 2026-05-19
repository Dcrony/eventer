const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireFeature } = require("../middleware/requirePro");
const { getLiveStreamAccess } = require("../controllers/proFeatureController");
const { getAgoraToken } = require("../controllers/liveStreamController");

const router = express.Router();

router.get("/", authMiddleware, requireFeature("LIVE_STREAM"), getLiveStreamAccess);
router.get("/:eventId/token", authMiddleware, getAgoraToken);

module.exports = router;
