const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireFeature } = require("../middleware/requirePro");
const { getLiveStreamAccess } = require("../controllers/proFeatureController");

const router = express.Router();

router.get("/", authMiddleware, requireFeature("LIVE_STREAM"), getLiveStreamAccess);

module.exports = router;
