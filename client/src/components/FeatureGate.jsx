import BlurOverlay from "./BlurOverlay";
import useFeatureAccess from "../hooks/useFeatureAccess";

export default function FeatureGate({ feature, children, onUpgrade, className = "" }) {
    const { hasAccess, promptUpgrade, featureLabel } = useFeatureAccess(feature);

    return (
        <div className={`feature-gate ${className}`}>
            {children}
            {!hasAccess && (
                <BlurOverlay
                    label={`${featureLabel} is Pro only`}
                    cta="Upgrade to unlock"
                    onUpgrade={onUpgrade || promptUpgrade}
                />
            )}
        </div>
    );
}
