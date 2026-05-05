import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  canAccessFeature,
  getFeatureLabel,
  isTrialActive,
  normalizePlan,
} from "../utils/planAccess";

export default function useFeatureAccess(featureName) {
  const { user } = useAuth();

  return useMemo(() => {
    const hasAccess = canAccessFeature(user, featureName);
    const trialActive = isTrialActive(user);
    const plan = normalizePlan(user?.plan);
    const isExpired = plan === "trial" && !trialActive;

    const promptUpgrade = () => {
      window.dispatchEvent(
        new CustomEvent("planUpgradeRequired", {
          detail: { featureName: getFeatureLabel(featureName) },
        }),
      );
    };

    return {
      hasAccess,
      isTrial: trialActive,
      isExpired,
      promptUpgrade,
      featureLabel: getFeatureLabel(featureName),
    };
  }, [user, featureName]);
}
