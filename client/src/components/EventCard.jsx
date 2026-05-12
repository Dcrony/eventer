import { useEffect, useState } from "react";
import { CalendarDays, Heart, MapPin, Ticket } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import icon from "../assets/icon.svg";
import { cn } from "../lib/utils";
import {
  formatEventDate,
  formatEventPrice,
  getEventImageUrl,
  getEventUrl,
} from "../utils/eventHelpers";
import EventCommentsModal from "./EventCommentsModal";
import EventEngagementBar from "./EventEngagementBar";
import VerifiedBadge from "./ui/verified-badge";
import { UserAvatar } from "./ui/avatar";
import { useToast } from "./ui/toast";
import ShareModal from "./ShareModal";

export default function EventCard({ event, onOrganizerClick, onEventChange, className }) {
  const [eventState, setEventState] = useState(event);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    setEventState(event);
  }, [event]);

  const syncEvent = (nextEvent) => {
    setEventState(nextEvent);
    onEventChange?.(nextEvent);
  };

  const handleProtectedAction = (callback) => {
    if (!localStorage.getItem("token")) {
      toast.info("Please log in to interact with events");
      navigate("/login");
      return;
    }
    callback();
  };

  const handleLike = (eventClick) => {
    eventClick.preventDefault();
    eventClick.stopPropagation();

    handleProtectedAction(async () => {
      const previousState = { ...eventState };
      const nextLiked = !eventState.isLiked;
      const nextLikeCount = Math.max(0, Number(eventState.likeCount || 0) + (nextLiked ? 1 : -1));

      setEventState(prev => ({
        ...prev,
        isLiked: nextLiked,
        likeCount: nextLikeCount,
      }));

      try {
        const { data } = await API.post(`/events/${eventState._id}/like`);
        syncEvent(data);
      } catch (error) {
        toast.error("Could not update like");
        setEventState(previousState);
      }
    });
  };

  const handleShare = async (eventClick) => {
    eventClick?.preventDefault?.();
    eventClick?.stopPropagation?.();
    setShareOpen(true);
  };

  const handleCommentsOpen = (eventClick) => {
    eventClick.preventDefault();
    eventClick.stopPropagation();
    setCommentsOpen(true);
  };

  const handleFavorite = (eventClick) => {
    eventClick.preventDefault();
    eventClick.stopPropagation();
    if (favoriteLoading) return;

    handleProtectedAction(async () => {
      const previousState = { ...eventState };
      const next = !eventState.isFavorited;

      setEventState(prev => ({ ...prev, isFavorited: next }));

      try {
        setFavoriteLoading(true);
        const { data } = await API.post(`/favorites/${eventState._id}`);
        const isFavorited = Boolean(data?.isFavorited);
        syncEvent({ ...eventState, isFavorited });
        toast.success(isFavorited ? "Added to favorites" : "Removed from favorites");
      } catch (error) {
        toast.error("Could not update favorites");
        setEventState(previousState);
      } finally {
        setFavoriteLoading(false);
      }
    });
  };

  const organizer = eventState?.createdBy || null;
  const imageUrl = getEventImageUrl(eventState);
  const showPlaceholder = !imageUrl || imageFailed;
  const favorited = Boolean(eventState.isFavorited);

  return (
    <>
      <article className={cn("group relative bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-pink-200/40", className)}>
        <Link to={`/event/${eventState._id}`} className="block">
          {/* Media Section */}
          <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
            {showPlaceholder ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                <img src={icon} alt="" className="w-12 h-12 mb-2 opacity-30" />
                <Ticket size={34} />
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={eventState.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            )}

            {/* Topline Badges */}
            <div className="absolute top-3 left-3 flex gap-1.5 z-10">
              {eventState.category && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[0.6rem] font-bold uppercase tracking-wide text-pink-600 shadow-sm">
                  {eventState.category}
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[0.6rem] font-bold uppercase tracking-wide text-gray-600 shadow-sm">
                {eventState.eventType || "In-person"}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4">
            <div className="mb-3">
              <h3 className="text-base font-bold text-gray-900 line-clamp-1 mb-1">
                {eventState.title}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2">
                {eventState.description || "Discover a new experience happening on TickiSpot."}
              </p>
            </div>

            {/* Meta Info */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CalendarDays size={12} className="text-pink-500 flex-shrink-0" />
                <span>{formatEventDate(eventState.startDate || eventState.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin size={12} className="text-pink-500 flex-shrink-0" />
                <span>{eventState.location || "Online event"}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <div className="flex-1 min-w-0">
                <span className="text-[0.6rem] font-bold uppercase tracking-wider text-gray-400 block">
                  Tickets
                </span>
                <strong className="text-sm font-extrabold text-gray-900">
                  {formatEventPrice(eventState)}
                </strong>
              </div>

              <button
                type="button"
                onClick={handleFavorite}
                disabled={favoriteLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  favorited
                    ? "bg-pink-50 text-pink-600 border border-pink-200"
                    : "bg-gray-100 text-gray-600 hover:bg-pink-50 hover:text-pink-500"
                }`}
                aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart size={14} className={favorited ? "fill-pink-500 text-pink-500" : ""} />
                <span>{favorited ? "Saved" : "Favorite"}</span>
              </button>
            </div>

            {/* Organizer Info */}
            <div
              className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 cursor-pointer"
              onClick={(eventClick) => {
                eventClick.preventDefault();
                eventClick.stopPropagation();
                if (organizer?._id) onOrganizerClick?.(organizer);
              }}
              role={onOrganizerClick ? "button" : undefined}
              tabIndex={onOrganizerClick ? 0 : undefined}
              onKeyDown={(eventClick) => {
                if (!onOrganizerClick) return;
                if (eventClick.key === "Enter" || eventClick.key === " ") {
                  eventClick.preventDefault();
                  if (organizer?._id) onOrganizerClick(organizer);
                }
              }}
            >
              <UserAvatar user={eventState.createdBy} className="w-8 h-8 rounded-lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-gray-900 truncate">
                    {organizer?.username || "Deleted Organizer"}
                  </span>
                  {organizer && <VerifiedBadge user={organizer} />}
                </div>
                <p className="text-[0.65rem] text-gray-400">Organizer</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Engagement Bar */}
        <EventEngagementBar
          event={eventState}
          onLike={handleLike}
          onComment={handleCommentsOpen}
          onShare={handleShare}
          compact
        />
      </article>

      <EventCommentsModal
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        eventId={eventState._id}
        eventTitle={eventState.title}
        initialComments={eventState.comments || []}
        initialCommentCount={eventState.commentCount || 0}
        onCommentCountChange={(nextCount, nextEvent) => {
          if (nextEvent) {
            syncEvent(nextEvent);
          } else {
            syncEvent({ ...eventState, commentCount: nextCount });
          }
        }}
      />

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={event.title}
        url={getEventUrl(event._id)}
      />
    </>
  );
}