export const FEATURES = {
  TEAM_MEMBERS: ["free", "pro"],
  PRIVATE_EVENTS: ["pro"],
  LIVE_STREAM: ["pro"],
  ANALYTICS_ADVANCED: ["pro"],
  TICKI_AI: ["pro"],
  PAYOUTS: ["free", "pro"],
  REFUNDS: ["free", "pro"],
};

const FEATURE_ALIASES = {
  analytics: "ANALYTICS_ADVANCED",
  analytics_advanced: "ANALYTICS_ADVANCED",
  live_stream: "LIVE_STREAM",
  livestream: "LIVE_STREAM",
  tickiai: "TICKI_AI",
  ticki_ai: "TICKI_AI",
  team: "TEAM_MEMBERS",
  team_members: "TEAM_MEMBERS",
  private_events: "PRIVATE_EVENTS",
  private: "PRIVATE_EVENTS",
  payouts: "PAYOUTS",
  refunds: "REFUNDS",
};

export const normalizeFeatureName = (featureName) =>
  String(featureName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "_");

export const resolveFeatureKey = (featureName) => {
  const normalized = normalizeFeatureName(featureName);
  if (!normalized) return null;
  return FEATURE_ALIASES[normalized] || normalized.toUpperCase();
};

export const FEATURE_LABELS = {
  TEAM_MEMBERS: "Team collaboration",
  PRIVATE_EVENTS: "Private events",
  LIVE_STREAM: "Live streaming",
  ANALYTICS_ADVANCED: "Advanced analytics",
  TICKI_AI: "TickiAI",
  PAYOUTS: "Payouts",
  REFUNDS: "Refunds",
};

export const getFeatureLabel = (featureName) => {
  const featureKey = resolveFeatureKey(featureName);
  return FEATURE_LABELS[featureKey] || String(featureName || "premium feature").replace(/[_-]+/g, " ");
};
