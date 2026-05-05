import useFeatureAccess from "./useFeatureAccess";

export default function usePlanAccess(featureName) {
  return useFeatureAccess(featureName).hasAccess;
}
