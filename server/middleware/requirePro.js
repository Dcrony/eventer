const { requireFeature } = require("../services/featureService");

const UPGRADE_MESSAGE = "Upgrade to Pro to access this feature";

const requirePro = requireFeature("TICKI_AI");

module.exports = { requirePro, requireFeature, UPGRADE_MESSAGE };
