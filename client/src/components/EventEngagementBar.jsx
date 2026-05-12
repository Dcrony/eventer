import { MessageCircle, Eye, Heart, Share2 } from "lucide-react";
import { formatCompactNumber } from "../utils/eventHelpers";
import { cn } from "../lib/utils";

function EngagementButton({ icon: Icon, active, label, count, onClick, compact }) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:bg-pink-50",
        active ? "text-pink-500" : "text-gray-500",
        compact ? "text-[0.7rem]" : "text-sm"
      )}
      onClick={onClick}
      aria-label={`${label} ${count}`}
    >
      <Icon size={compact ? 14 : 16} className={active ? "fill-pink-500" : ""} />
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
    <div className={cn(
      "flex items-center gap-1 border-t border-gray-200 bg-gray-50/50 px-3 py-2",
      compact ? "justify-between" : "justify-start"
    )}>
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
      <div className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-400" aria-label={`Views ${event?.viewCount || 0}`}>
        <Eye size={compact ? 14 : 16} />
        <span>{formatCompactNumber(event?.viewCount || 0)}</span>
      </div>
    </div>
  );
}