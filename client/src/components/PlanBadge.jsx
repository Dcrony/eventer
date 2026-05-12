export default function PlanBadge({ plan = "free", trialEndsAt }) {
    const normalized = String(plan || "free").toLowerCase();
    const label = normalized === "pro" ? "Pro" : normalized === "trial" ? "Trial" : "Free";
    const description =
        normalized === "trial"
            ? `Trial ends ${trialEndsAt ? new Date(trialEndsAt).toLocaleDateString() : "soon"}`
            : normalized === "pro"
                ? "Pro access"
                : "Free plan";

    const badgeStyles = {
        free: "bg-gray-100 text-gray-600 border-gray-200",
        pro: "bg-pink-50 text-pink-600 border-pink-200",
        trial: "bg-amber-50 text-amber-600 border-amber-200",
    };

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${badgeStyles[normalized] || badgeStyles.free}`}>
            <strong className="text-xs font-extrabold uppercase tracking-wide">{label}</strong>
            <small className="text-[0.65rem] font-medium">{description}</small>
        </div>
    );
}