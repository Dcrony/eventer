const Event = require("../models/Event");
const User = require("../models/User");
const { ensureSubscriptionState, hasProAccess } = require("../services/subscriptionService");

/**
 * Free plan: max 2 events created per calendar month.
 * Trial / Pro / Admin: no limit.
 */
exports.checkPlanLimit = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select("plan role trialEndsAt subscriptionStatus");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    await ensureSubscriptionState(user);

    if (hasProAccess(user) || user.role === "admin") {
      return next();
    }

    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const count = await Event.countDocuments({
      createdBy: userId,
      createdAt: { $gte: start },
    });

    if (count >= 2) {
      return res.status(403).json({
        code: "PLAN_LIMIT",
        message: "Free plan allows up to 2 events per month. Upgrade to Pro or Business to create more.",
      });
    }

    return next();
  } catch (err) {
    console.error("checkPlanLimit error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.checkUserPlan = (feature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id || req.user.id;
      const user = await User.findById(userId).select("plan role trialEndsAt subscriptionStatus");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.role === "admin") return next();

      await ensureSubscriptionState(user);

      if (feature === "analytics" && !hasProAccess(user)) {
        return res.status(403).json({
          code: "PLAN_UPGRADE_REQUIRED",
          message: "Upgrade to Pro to access this feature",
        });
      }

      if (feature === "featured" && !hasProAccess(user)) {
        return res.status(403).json({
          code: "PLAN_UPGRADE_REQUIRED",
          message: "Upgrade to Pro to access this feature",
        });
      }

      return next();
    } catch (err) {
      console.error("checkUserPlan error", err);
      return res.status(500).json({ message: "Server error" });
    }
  };
};
