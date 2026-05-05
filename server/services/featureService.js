const { normalizePlan, isTrialActive, ensureSubscriptionState } = require("./subscriptionService");

const FEATURES = Object.freeze({
  TEAM_MEMBERS: ["free", "pro"],
  PRIVATE_EVENTS: ["pro"],
  LIVE_STREAM: ["pro"],
  ANALYTICS_ADVANCED: ["pro"],
  TICKI_AI: ["pro"],
  PAYOUTS: ["free", "pro"],
  REFUNDS: ["free", "pro"],
});

const normalizeFeatureName = (featureName) =>
  String(featureName || "")
    .trim()
    .replace(/[-\s]+/g, "_")
    .toUpperCase();

const getFeatureLabel = (featureName) => {
  const label = normalizeFeatureName(featureName);

  return {
    TEAM_MEMBERS: "Team collaboration",
    PRIVATE_EVENTS: "Private events",
    LIVE_STREAM: "Live streaming",
    ANALYTICS_ADVANCED: "Advanced analytics",
    TICKI_AI: "TickiAI",
    PAYOUTS: "Payouts",
    REFUNDS: "Refunds",
  }[label] || String(featureName || "premium feature").replace(/_/g, " ");
};

const hasAccess = (user, featureName, now = new Date()) => {
  if (!user || !featureName) return false;
  if (isTrialActive(user, now)) return true;

  const normalizedFeature = normalizeFeatureName(featureName);
  const allowedPlans = FEATURES[normalizedFeature];
  return Array.isArray(allowedPlans) && allowedPlans.includes(normalizePlan(user?.plan));
};

const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (req.user.role === "admin") {
        return next();
      }

      await ensureSubscriptionState(req.user);

      if (!hasAccess(req.user, featureName)) {
        return res.status(403).json({
          code: "PLAN_UPGRADE_REQUIRED",
          message: `Upgrade to Pro to access ${getFeatureLabel(featureName)}.`,
          feature: normalizeFeatureName(featureName),
          plan: req.user.plan || "free",
          trialEndsAt: req.user.trialEndsAt || null,
        });
      }

      return next();
    } catch (error) {
      console.error("requireFeature error", error);
      return res.status(500).json({ message: "Server error" });
    }
  };
};

module.exports = {
  FEATURES,
  normalizeFeatureName,
  getFeatureLabel,
  hasAccess,
  requireFeature,
};
