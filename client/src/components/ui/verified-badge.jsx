import { BadgeCheck } from "lucide-react";
import Tooltip from "./tooltip";
import { isVerifiedOrganizer } from "../../utils/eventHelpers";

export default function VerifiedBadge({ user, verificationStatus, className, size = 16 }) {
  const verified = typeof verificationStatus === "string"
    ? String(verificationStatus).toLowerCase() === "approved"
    : isVerifiedOrganizer(user);

  if (!verified) return null;

  return (
    <Tooltip content="Verified Organizer" className={className}>
      <span className="inline-flex text-pink-500" aria-label="Verified Organizer">
        <BadgeCheck size={size} strokeWidth={2.5} />
      </span>
    </Tooltip>
  );
}
