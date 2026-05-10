import UpgradeExperienceModal from "./UpgradeExperienceModal";
import { getFeatureLabel } from "../utils/featureFlags";

export default function UpgradeModal({ featureName, ...props }) {
    return (
        <UpgradeExperienceModal
            {...props}
            featureName={getFeatureLabel(featureName)}
        />
    );
}
