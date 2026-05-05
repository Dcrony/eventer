const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireFeature } = require("../middleware/requirePro");
const { getStats } = require("../controllers/statController");
const { getAnalyticsAccess } = require("../controllers/proFeatureController");

const router = express.Router();

router.get("/", authMiddleware, requireFeature("ANALYTICS_ADVANCED"), getAnalyticsAccess);
router.get("/overview", authMiddleware, requireFeature("ANALYTICS_ADVANCED"), getStats);

module.exports = router;
