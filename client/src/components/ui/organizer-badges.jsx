import { BadgeCheck, Crown } from "lucide-react";
import { cn } from "../../lib/utils";
import { getOrganizerBadgeState } from "../../utils/eventHelpers";

function BadgePill({ icon: Icon, label, tone, className }) {
  const tones = {
    verified: "border-blue-100 bg-blue-50 text-blue-700",
    premium: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.65rem] font-bold tracking-wide",
        tones[tone] || tones.verified,
        className,
      )}
    >
      <Icon size={12} strokeWidth={2.5} />
      {label}
    </span>
  );
}

export function VerifiedOrganizerBadge({ user, verificationStatus, className }) {
  const state = getOrganizerBadgeState(user);
  const verified = typeof verificationStatus === "string"
    ? String(verificationStatus).toLowerCase() === "approved"
    : state.isVerified;

  if (!verified) return null;

  return <BadgePill icon={BadgeCheck} label="" tone="verified" className={className} />;
}

export function PremiumOrganizerBadge({ user, subscriptionStatus, className }) {
  const state = getOrganizerBadgeState(user);
  const premium = typeof subscriptionStatus === "string"
    ? String(subscriptionStatus).toLowerCase() === "active"
    : state.isPremium;

  if (!premium) return null;

  return <BadgePill icon={Crown} label="" tone="premium" className={className} />;
}

export default function OrganizerBadges({ user, className, verificationStatus, subscriptionStatus, layout = "vertical" }) {
  const state = getOrganizerBadgeState(user);
  const verified = typeof verificationStatus === "string" ? String(verificationStatus).toLowerCase() === "approved" : state.isVerified;
  const premium = typeof subscriptionStatus === "string" ? String(subscriptionStatus).toLowerCase() === "active" : state.isPremium;

  if (!verified && !premium) return null;

  return (
    <div className={cn(layout === "horizontal" ? "flex flex-wrap items-center gap-1.5" : "flex flex-col gap-1", className)}>
      {verified && <BadgePill icon={BadgeCheck} label="Verified Organizer" tone="verified" />}
      {premium && <BadgePill icon={Crown} label="Premium Organizer" tone="premium" />}
    </div>
  );
}
