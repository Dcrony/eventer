import { BadgeCheck } from "lucide-react";
import Tooltip from "./tooltip";
import { isVerifiedOrganizer } from "../../utils/eventHelpers";

export default function VerifiedBadge({ user, className }) {
  if (!isVerifiedOrganizer(user)) return null;

  return (
    <Tooltip content="Verified Organizer" className={className}>
      <span className="inline-flex text-pink-500" aria-label="Verified Organizer">
        <BadgeCheck size={16} strokeWidth={2.5} />
      </span>
    </Tooltip>
  );
}