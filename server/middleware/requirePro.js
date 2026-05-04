const { ensureSubscriptionState, hasProAccess } = require("../services/subscriptionService");

const UPGRADE_MESSAGE = "Upgrade to Pro to access this feature";

const requirePro = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role === "admin") {
      return next();
    }

    await ensureSubscriptionState(req.user);

    if (!hasProAccess(req.user)) {
      return res.status(403).json({
        code: "PLAN_UPGRADE_REQUIRED",
        message: UPGRADE_MESSAGE,
        plan: req.user.plan || "free",
        trialEndsAt: req.user.trialEndsAt || null,
      });
    }

    return next();
  } catch (error) {
    console.error("requirePro error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { requirePro, UPGRADE_MESSAGE };
