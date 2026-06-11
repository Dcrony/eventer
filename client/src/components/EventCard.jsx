import { useEffect, useState } from "react";
import { CalendarDays, Heart, MapPin, MessageCircle, Share2, Star, Ticket, Users } from "lucide-react";
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
import VerifiedBadge from "./ui/verified-badge";
import { UserAvatar } from "./ui/avatar";
import { useToast } from "./ui/toast";
import ShareModal from "./WhatsAppShareModal";
import { loadOrganizerReputation } from "../utils/reputationUtils";

export default function EventCard({ event, onOrganizerClick, onEventChange, className }) {
  const [eventState, setEventState] = useState(event);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [organizerReputation, setOrganizerReputation] = useState(null);

  const navigate = useNavigate();
  const toast = useToast();

  const currentUserId = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      return u?._id || u?.id || null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    setEventState(event);
  }, [event]);

  useEffect(() => {
    if (event?.createdBy?._id) {
      loadOrganizerReputation(event.createdBy._id).then(setOrganizerReputation);
    }
  }, [event?.createdBy?._id]);

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

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleProtectedAction(async () => {
      const previousState = { ...eventState };
      const nextLiked = !eventState.isLiked;
      const nextLikeCount = Math.max(0, Number(eventState.likeCount || 0) + (nextLiked ? 1 : -1));
      setEventState((prev) => ({ ...prev, isLiked: nextLiked, likeCount: nextLikeCount }));
      try {
        const { data } = await API.post(`/events/${eventState._id}/like`);
        syncEvent(data);
      } catch {
        toast.error("Could not update like");
        setEventState(previousState);
      }
    });
  };

  const handleShare = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setShareOpen(true);
  };

  const handleCommentsOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCommentsOpen(true);
  };

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (favoriteLoading) return;
    handleProtectedAction(async () => {
      const previousState = { ...eventState };
      const next = !eventState.isFavorited;
      setEventState((prev) => ({ ...prev, isFavorited: next }));
      try {
        setFavoriteLoading(true);
        const { data } = await API.post(`/favorites/${eventState._id}`);
        const isFavorited = Boolean(data?.isFavorited);
        syncEvent({ ...eventState, isFavorited });
        toast.success(isFavorited ? "Added to favorites" : "Removed from favorites");
      } catch {
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
  const liked = Boolean(eventState.isLiked);

  const ticketsSold = Number(eventState?.ticketsSold) || 0;
  const totalTickets =
    Number(event?.capacity) ||
    Number(eventState?.capacity) ||
    Number(event?.totalTickets) ||
    Number(eventState?.totalTickets) ||
    0;
  const soldPercentage = totalTickets > 0 ? Math.min(100, (ticketsSold / totalTickets) * 100) : 0;
  const isSoldOut = soldPercentage >= 100;
  const isAlmostFull = soldPercentage >= 80 && !isSoldOut;

  const avgRating = organizerReputation?.ratingStats?.averageRating;
  const totalRatings = organizerReputation?.ratingStats?.totalRatings;

  const statusConfig = {
    Live: { bg: "bg-red-500", label: "Started", pulse: true },
    Upcoming: { bg: "bg-blue-500", label: "Upcoming" },
    Ended: { bg: "bg-gray-500", label: "Ended" },
    Cancelled: { bg: "bg-red-600", label: "Cancelled" },
    Suspended: { bg: "bg-red-700", label: "Suspended" },
    Draft: { bg: "bg-gray-600", label: "Draft" },
    "Pending Approval": { bg: "bg-amber-500", label: "Pending" },
    Published: { bg: "bg-green-600", label: "Published" },
  };
  const lifecycleConfig = statusConfig[eventState.eventLifecycleStatus];

  return (
    <>
      <article
        className={cn(
          "group relative bg-white rounded-xl border border-gray-200/80 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 hover:border-gray-300",
          className
        )}
      >
        <Link to={`/event/${eventState._id}`} className="block">
          {/* ── Media ── */}
          <div className="relative aspect-video overflow-hidden bg-gray-900">
            {showPlaceholder ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-800 to-gray-900">
                <img src={icon} alt="" className="w-10 h-10 opacity-20" />
                <Ticket size={28} className="text-white/10" />
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={eventState.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            )}

            {/* Top-left badges */}
            <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10">
              {lifecycleConfig && (
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold tracking-wide text-white",
                    lifecycleConfig.bg,
                    lifecycleConfig.pulse && "animate-pulse"
                  )}
                >
                  {lifecycleConfig.label}
                </span>
              )}
              {eventState.status === "pending" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500 text-[0.65rem] font-semibold tracking-wide text-white">
                  Pending review
                </span>
              )}
              {eventState.category && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[0.65rem] font-semibold text-pink-600">
                  {eventState.category}
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[0.65rem] font-semibold text-gray-600">
                {eventState.eventType || "In-person"}
              </span>
            </div>

            {/* Top-right: save button */}
            <button
              type="button"
              onClick={handleFavorite}
              disabled={favoriteLoading}
              className={cn(
                "absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 z-10",
                favorited
                  ? "bg-pink-500 shadow-md shadow-pink-500/30"
                  : "bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-pink-50"
              )}
              aria-label={favorited ? "Remove from saved" : "Save event"}
            >
              <Heart
                size={14}
                className={favorited ? "fill-white text-white" : "text-gray-500"}
              />
            </button>

            {/* Bottom-right: price chip */}
            <div className="absolute bottom-2.5 right-2.5 z-10 bg-black/75 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              {formatEventPrice(eventState)}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-4 pt-3.5 pb-3">
            {/* Title + description */}
            <h3 className="text-sm font-semibold text-gray-900 leading-snug truncate mb-1">
              {eventState.title}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
              {eventState.description || "Discover a new experience happening on TickiSpot."}
            </p>

            {/* Date + Location */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CalendarDays size={12} className="text-pink-500 flex-shrink-0" />
                <span>{formatEventDate(eventState.startDate || eventState.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin size={12} className="text-pink-500 flex-shrink-0" />
                <span className="truncate">{eventState.location || "Online event"}</span>
              </div>
            </div>

            {/* Capacity bar */}
            {totalTickets > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-[0.65rem] text-gray-500">
                    <Users size={10} className="text-pink-500" />
                    {ticketsSold} / {totalTickets} registered
                  </span>
                  <span
                    className={cn(
                      "text-[0.65rem] font-medium",
                      isSoldOut ? "text-red-500" : isAlmostFull ? "text-amber-500" : "text-gray-400"
                    )}
                  >
                    {isSoldOut ? "Sold out" : isAlmostFull ? "Almost full" : `${Math.round(soldPercentage)}%`}
                  </span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isSoldOut ? "bg-red-400" : isAlmostFull ? "bg-amber-400" : "bg-pink-400"
                    )}
                    style={{ width: `${soldPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Organizer row */}
            <div
              className="flex items-center gap-2.5 pt-3 border-t border-gray-100 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (organizer?._id) navigate(`/users/${organizer._id}`);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (organizer?._id) navigate(`/users/${organizer._id}`);
                }
              }}
            >
              <UserAvatar
                user={eventState.createdBy}
                className="w-8 h-8 rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-gray-900 truncate">
                    {organizer?.username || "Deleted organizer"}
                  </span>
                  {organizer && <VerifiedBadge user={organizer} />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[0.6rem] text-gray-400">Organizer</span>
                  {totalRatings > 0 && (
                    <span className="flex items-center gap-0.5 text-[0.6rem] text-gray-400">
                      <Star size={9} className="fill-amber-400 text-amber-400" />
                      {avgRating?.toFixed(1)} · {totalRatings} reviews
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* ── Footer: engagement ── */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
          <div className="flex items-center gap-0.5">
            {/* Like */}
            <button
              type="button"
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                liked
                  ? "text-pink-500 bg-pink-50 hover:bg-pink-100"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              )}
              aria-label={`Like (${eventState.likeCount || 0})`}
            >
              <Heart size={13} className={liked ? "fill-pink-500" : ""} />
              <span>{eventState.likeCount || 0}</span>
            </button>

            {/* Comment */}
            <button
              type="button"
              onClick={handleCommentsOpen}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
              aria-label={`Comments (${eventState.commentCount || 0})`}
            >
              <MessageCircle size={13} />
              <span>{eventState.commentCount || 0}</span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
              aria-label="Share"
            >
              <Share2 size={13} />
            </button>
          </div>

          {/* CTA */}
          <Link
            to={`/event/${eventState._id}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              isSoldOut
                ? "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
                : "bg-pink-500 text-white hover:bg-pink-600"
            )}
          >
            <Ticket size={12} />
            {isSoldOut ? "Sold out" : "Get tickets"}
          </Link>
        </div>
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
        event={eventState}
        currentUserId={currentUserId}
      />
    </>
  );
}