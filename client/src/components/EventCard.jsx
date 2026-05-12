import { useEffect, useState } from "react";
import { CalendarDays, Heart, MapPin, Ticket, Users } from "lucide-react";
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
  
  // Get ticket information - use originalEvent props for totalTickets if available
  // This ensures totalTickets never changes even if the API sends wrong data
  const ticketsSold = Number(eventState?.ticketsSold) || 0;
  // Use the original totalTickets from the initial event prop, not from eventState that might have been updated
  const totalTickets = Number(event?.totalTickets) || Number(eventState?.totalTickets) || 0;
  const soldPercentage = totalTickets > 0 ? Math.min(100, (ticketsSold / totalTickets) * 100) : 0;

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
            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-10">
              {eventState.category && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[0.65rem] font-bold uppercase tracking-wide text-pink-600 shadow-sm">
                  {eventState.category}
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[0.65rem] font-bold uppercase tracking-wide text-gray-600 shadow-sm">
                {eventState.eventType || "In-person"}
              </span>
            </div>

            {/* Favorite Button - Top Right */}
            <button
              type="button"
              onClick={handleFavorite}
              disabled={favoriteLoading}
              className={`absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-[0.65rem] font-semibold transition-all duration-200 z-10 ${
                favorited
                  ? "bg-pink-500 text-white shadow-md shadow-pink-500/30"
                  : "bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-pink-50 hover:text-pink-500 border border-gray-200"
              }`}
              aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart size={12} className={favorited ? "fill-white" : ""} />
              <span>{favorited ? "Saved" : "Favorite"}</span>
            </button>
          </div>

          {/* Content Section */}
          <div className="p-4 pb-2">
            <div className="mb-2">
              <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">
                {eventState.title}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2">
                {eventState.description || "Discover a new experience happening on TickiSpot."}
              </p>
            </div>

            {/* Meta Info */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CalendarDays size={12} className="text-pink-500 flex-shrink-0" />
                  <span>{formatEventDate(eventState.startDate || eventState.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={12} className="text-pink-500 flex-shrink-0" />
                  <span className="truncate">{eventState.location || "Online event"}</span>
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                <span className="text-[0.6rem] font-bold uppercase tracking-wider text-gray-400 block">
                  Tickets
                </span>
                <strong className="text-base font-extrabold text-gray-900">
                  {formatEventPrice(eventState)}
                </strong>
              </div>
            </div>

            {/* Ticket Sold Info - Always visible */}
            {totalTickets > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Users size={10} className="text-pink-500" />
                    <span className="text-[0.65rem] font-medium text-gray-500">
                      {ticketsSold} / {totalTickets} sold
                    </span>
                  </div>
                  <span className="text-[0.6rem] text-gray-400">
                    {Math.round(soldPercentage)}%
                  </span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${soldPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Organizer Info */}
            <div
              className="flex items-center gap-2 pt-2 border-t border-gray-100 cursor-pointer"
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
              <UserAvatar user={eventState.createdBy} className="w-7 h-7 rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs font-semibold text-gray-900 truncate">
                    {organizer?.username || "Deleted Organizer"}
                  </span>
                  {organizer && <VerifiedBadge user={organizer} />}
                </div>
                <p className="text-[0.6rem] text-gray-400">Organizer</p>
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