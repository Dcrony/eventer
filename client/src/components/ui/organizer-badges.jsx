import { BadgeCheck, Crown, ShieldCheck } from "lucide-react";
import { cn } from "../../lib/utils";
import { getOrganizerBadgeState } from "../../utils/eventHelpers";

const ADMIN_ROLES = ["super_admin", "admin", "moderator", "finance_admin", "support_admin"];

const isAdminRole = (role) => ADMIN_ROLES.includes(String(role || "").toLowerCase());

function BadgePill({ icon: Icon, label, tone, className }) {
  const tones = {
    verified: "border-blue-100 bg-blue-50 text-blue-700",
    premium: "border-amber-200 bg-amber-50 text-amber-700",
    admin: "border-violet-200 bg-violet-50 text-violet-700",
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

  return <BadgePill icon={BadgeCheck} label="Verified Organizer" tone="verified" className={className} />;
}

export function PremiumOrganizerBadge({ user, subscriptionStatus, className }) {
  const state = getOrganizerBadgeState(user);
  const premium = typeof subscriptionStatus === "string"
    ? String(subscriptionStatus).toLowerCase() === "active"
    : state.isPremium;

  if (!premium) return null;

  return <BadgePill icon={Crown} label="Premium Organizer" tone="premium" className={className} />;
}

export function AdminBadge({ user, className }) {
  if (!isAdminRole(user?.role)) return null;

  return (
    <BadgePill
      icon={ShieldCheck}
      // label={user?.role === "super_admin" ? "Super Admin" : "Admin"}
      tone="admin"
      className={className}
    />
  );
}

export default function OrganizerBadges({ user, className, verificationStatus, subscriptionStatus, layout = "vertical" }) {
  const state = getOrganizerBadgeState(user);
  const verified = typeof verificationStatus === "string" ? String(verificationStatus).toLowerCase() === "approved" : state.isVerified;
  const premium = typeof subscriptionStatus === "string" ? String(subscriptionStatus).toLowerCase() === "active" : state.isPremium;

  if (!verified && !premium && !isAdminRole(user?.role)) return null;

  return (
    <div className={cn(layout === "horizontal" ? "flex flex-wrap items-center gap-1.5" : "flex flex-col gap-1", className)}>
      <AdminBadge user={user} />
      {verified && <BadgePill icon={BadgeCheck} label="Verified Organizer" tone="verified" />}
      {premium && <BadgePill icon={Crown} label="Premium Organizer" tone="premium" />}
    </div>
  );
}
