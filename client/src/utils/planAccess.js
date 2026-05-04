const PRO_FEATURES = new Set([
  "tickiai",
  "analytics",
  "live_stream",
  "team",
  "private_events",
  "custom_branding",
  "priority_payouts",
]);

export const normalizePlan = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "business") return "pro";
  if (["free", "trial", "pro"].includes(normalized)) return normalized;
  return "free";
};

export const isTrialActive = (user) => {
  if (normalizePlan(user?.plan) !== "trial" || !user?.trialEndsAt) return false;
  return new Date(user.trialEndsAt).getTime() > Date.now();
};

export const hasProAccess = (user) => normalizePlan(user?.plan) === "pro" || isTrialActive(user);

export const getTrialDaysRemaining = (user) => {
  if (!isTrialActive(user)) return 0;
  const diff = new Date(user.trialEndsAt).getTime() - Date.now();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
};

export const isTrialEndingSoon = (user, thresholdDays = 3) => {
  const days = getTrialDaysRemaining(user);
  return days > 0 && days <= thresholdDays;
};

export const canAccessFeature = (user, featureName) => {
  const feature = String(featureName || "").trim().toLowerCase();
  if (!feature || !PRO_FEATURES.has(feature)) return true;
  return hasProAccess(user);
};

export const promptUpgrade = (featureName) => {
  window.dispatchEvent(
    new CustomEvent("planUpgradeRequired", {
      detail: { featureName },
    }),
  );
};
