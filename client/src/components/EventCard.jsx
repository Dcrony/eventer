import { useEffect, useState } from "react"; // Removed startTransition and useOptimistic
import { CalendarDays, Heart, MapPin, Ticket } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import icon from "../assets/icon.svg";
import useShareLink from "../hooks/useShareLink";
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
import "./css/EventCard.css";
import ShareModal from "./ShareModal";

export default function EventCard({ event, onOrganizerClick, onEventChange, className }) {
  const [eventState, setEventState] = useState(event);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
  
  
  const navigate = useNavigate();
  const shareLink = useShareLink();
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
      const previousState = { ...eventState }; // Save for rollback
      const nextLiked = !eventState.isLiked;
      const nextLikeCount = Math.max(0, Number(eventState.likeCount || 0) + (nextLiked ? 1 : -1));

      // 1. Optimistic Update
      setEventState(prev => ({
        ...prev,
        isLiked: nextLiked,
        likeCount: nextLikeCount,
      }));

      try {
        const { data } = await API.post(`/events/${eventState._id}/like`);
        syncEvent(data); // 2. Sync with real server data
      } catch (error) {
        toast.error("Could not update like");
        setEventState(previousState); // 3. Rollback on failure
      }
    });
  };

  const handleShare = async (eventClick) => {
   setShareOpen(true);
    // eventClick.preventDefault();
    // eventClick.stopPropagation();
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

      // Optimistic Update
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
      <article className={cn("social-event-card", className)}>
        <Link to={`/Eventdetail/${eventState._id}`} className="social-event-card-link">
          <div className="social-event-card-media">
            {showPlaceholder ? (
              <div className="social-event-card-placeholder" aria-hidden="true">
                <div className="social-event-card-placeholder-glow" />
                <img src={icon} alt="" className="social-event-card-placeholder-logo" />
                <Ticket size={34} />
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={eventState.title}
                className="social-event-card-image"
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            )}

            <div className="social-event-card-topline">
              {eventState.category ? <span className="social-event-card-chip">{eventState.category}</span> : null}
              <span className="social-event-card-chip outline">
                {eventState.eventType || "In-person"}
              </span>
            </div>
          </div>

          <div className="social-event-card-content">
            <div className="social-event-card-head">
              <h3>{eventState.title}</h3>
              <p>{eventState.description || "Discover a new experience happening on TickiSpot."}</p>
            </div>

            <div className="social-event-card-meta">
              <span>
                <CalendarDays size={15} />
                {formatEventDate(eventState.startDate || eventState.date)}
              </span>
              <span>
                <MapPin size={15} />
                {eventState.location || "Online event"}
              </span>
            </div>

            <div className="social-event-card-footer">
              <div className="social-event-card-price">
                <span>Tickets</span>
                <strong>{formatEventPrice(eventState)}</strong>
              </div>
              <button
                type="button"
                className={`social-event-favorite ${favorited ? "is-active" : ""}`}
                onClick={handleFavorite}
                disabled={favoriteLoading}
                aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart size={16} />
                <span>{favorited ? "Saved" : "Favorite"}</span>
              </button>

              <div
                className="social-event-card-organizer"
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
                <div className="social-event-card-organizer-avatar">
                  <UserAvatar user={eventState.createdBy} className="social-event-card-organizer-avatar-img" />
                </div>
                <div className="social-event-card-organizer-copy">
                  <span>
                    {organizer?.username || "Deleted Organizer"}
                    {organizer && <VerifiedBadge user={organizer} />}
                  </span>
                  <small>{organizer ? "Organizer" : "Account removed"}</small>
                </div>
              </div>
            </div>
          </div>
        </Link>

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