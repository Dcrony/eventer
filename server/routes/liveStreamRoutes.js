const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requirePro } = require("../middleware/requirePro");
const { getLiveStreamAccess } = require("../controllers/proFeatureController");

const router = express.Router();

router.get("/", authMiddleware, requirePro, getLiveStreamAccess);

module.exports = router;
