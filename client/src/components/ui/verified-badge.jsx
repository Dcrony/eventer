import { BadgeCheck } from "lucide-react";
import Tooltip from "./tooltip";
import { isVerifiedOrganizer } from "../../utils/eventHelpers";

export default function VerifiedBadge({ user, className }) {
  if (!isVerifiedOrganizer(user)) return null;

  return (
    <Tooltip content="Verified Organizer" className={className}>
      <span className="verified-organizer-badge" aria-label="Verified Organizer">
        <BadgeCheck size={16} />
      </span>
    </Tooltip>
  );
}
