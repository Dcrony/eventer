const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireFeature } = require("../middleware/requirePro");
const { getTeamWorkspace } = require("../controllers/proFeatureController");

const router = express.Router();

router.get("/", authMiddleware, requireFeature("TEAM_MEMBERS"), getTeamWorkspace);

module.exports = router;
