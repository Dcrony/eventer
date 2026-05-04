const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requirePro } = require("../middleware/requirePro");
const { getStats } = require("../controllers/statController");
const { getAnalyticsAccess } = require("../controllers/proFeatureController");

const router = express.Router();

router.get("/", authMiddleware, requirePro, getAnalyticsAccess);
router.get("/overview", authMiddleware, requirePro, getStats);

module.exports = router;
