import { MessageCircle, Eye, Heart, Share2 } from "lucide-react";
import { formatCompactNumber } from "../utils/eventHelpers";
import { cn } from "../lib/utils";

function EngagementButton({ icon: Icon, active, label, count, onClick, compact }) {
  return (
    <button
      type="button"
      className={cn("event-engagement-button", active && "is-active", compact && "is-compact")}
      onClick={onClick}
      aria-label={`${label} ${count}`}
    >
      <Icon size={16} />
      <span>{formatCompactNumber(count)}</span>
    </button>
  );
}

export default function EventEngagementBar({
  event,
  compact,
  onLike,
  onComment,
  onShare,
}) {
  return (
    <div className={cn("event-engagement-bar", compact && "is-compact")}>
      <EngagementButton
        icon={Heart}
        label="Likes"
        count={event?.likeCount || 0}
        active={event?.isLiked}
        onClick={onLike}
        compact={compact}
      />
      <EngagementButton
        icon={MessageCircle}
        label="Comments"
        count={event?.commentCount || 0}
        onClick={onComment}
        compact={compact}
      />
      <EngagementButton
        icon={Share2}
        label="Shares"
        count={event?.shareCount || 0}
        onClick={onShare}
        compact={compact}
      />
      <div className="event-engagement-stat" aria-label={`Views ${event?.viewCount || 0}`}>
        <Eye size={16} />
        <span>{formatCompactNumber(event?.viewCount || 0)}</span>
      </div>
    </div>
  );
}
