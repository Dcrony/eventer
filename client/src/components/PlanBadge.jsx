export default function PlanBadge({ plan = "free", trialEndsAt }) {
    const normalized = String(plan || "free").toLowerCase();
    const label = normalized === "pro" ? "Pro" : normalized === "trial" ? "Trial" : "Free";
    const description =
        normalized === "trial"
            ? `Trial ends ${trialEndsAt ? new Date(trialEndsAt).toLocaleDateString() : "soon"}`
            : normalized === "pro"
                ? "Pro access"
                : "Free plan";

    return (
        <span className={`plan-badge plan-badge--${normalized}`}>
            <strong>{label}</strong>
            <small>{description}</small>
        </span>
    );
}
