const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requirePro } = require("../middleware/requirePro");
const { getTeamWorkspace } = require("../controllers/proFeatureController");

const router = express.Router();

router.get("/", authMiddleware, requirePro, getTeamWorkspace);

module.exports = router;
