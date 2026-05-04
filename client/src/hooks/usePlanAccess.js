import { useAuth } from "../context/AuthContext";
import { canAccessFeature } from "../utils/planAccess";

export default function usePlanAccess(featureName) {
  const { user } = useAuth();
  return canAccessFeature(user, featureName);
}
