import {
  FEATURES,
  resolveFeatureKey,
  getFeatureLabel,
} from "./featureFlags";

export { getFeatureLabel } from "./featureFlags";

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
  const featureKey = resolveFeatureKey(featureName);
  if (!featureKey || !Object.prototype.hasOwnProperty.call(FEATURES, featureKey)) return true;
  if (isTrialActive(user)) return true;
  return FEATURES[featureKey].includes(normalizePlan(user?.plan));
};

export const promptUpgrade = (featureName) => {
  window.dispatchEvent(
    new CustomEvent("planUpgradeRequired", {
      detail: { featureName: getFeatureLabel(featureName) },
    }),
  );
};

export const getFeatureLabelFromName = (featureName) => getFeatureLabel(featureName);
