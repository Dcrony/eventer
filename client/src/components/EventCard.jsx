import { useEffect, useState, startTransition, useOptimistic } from "react";
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

export default function EventCard({ event, onOrganizerClick, onEventChange, className }) {
  const [eventState, setEventState] = useState(event);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [optimisticEvent, updateOptimisticEvent] = useOptimistic(eventState, (current, patch) => ({
    ...current,
    ...patch,
  }));
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

    handleProtectedAction(() => {
      const nextLiked = !optimisticEvent.isLiked;
      const nextLikeCount = Math.max(0, Number(optimisticEvent.likeCount || 0) + (nextLiked ? 1 : -1));

      startTransition(async () => {
        updateOptimisticEvent({
          isLiked: nextLiked,
          likeCount: nextLikeCount,
        });

        try {
          const { data } = await API.post(`/events/${eventState._id}/like`);
          syncEvent(data);
        } catch (error) {
          console.error("Like update failed:", error);
          toast.error("Could not update like");
          syncEvent(eventState);
        }
      });
    });
  };

  const handleShare = async (eventClick) => {
    eventClick.preventDefault();
    eventClick.stopPropagation();

    const eventUrl = getEventUrl(eventState._id);
    const shared = await shareLink({
      title: eventState.title,
      text: `Check out ${eventState.title} on TickiSpot`,
      url: eventUrl,
      copiedMessage: "Event link copied to clipboard",
    });

    if (!shared) return;

    startTransition(async () => {
      updateOptimisticEvent({
        shareCount: Number(optimisticEvent.shareCount || 0) + 1,
      });

      try {
        const { data } = await API.post(`/events/${eventState._id}/share`);
        syncEvent(data);
      } catch (error) {
        console.error("Share tracking failed:", error);
      }
    });
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

    handleProtectedAction(() => {
      const prev = Boolean(eventState.isFavorited);
      const next = !prev;

      startTransition(async () => {
        updateOptimisticEvent({ isFavorited: next });
        try {
          setFavoriteLoading(true);
          const { data } = await API.post(`/favorites/${eventState._id}`);
          const isFavorited = Boolean(data?.isFavorited);
          syncEvent({ ...eventState, isFavorited });
          toast.success(isFavorited ? "Added to favorites" : "Removed from favorites");
        } catch (error) {
          console.error("Favorite toggle failed:", error);
          toast.error("Could not update favorites");
          updateOptimisticEvent({ isFavorited: prev });
          syncEvent(eventState);
        } finally {
          setFavoriteLoading(false);
        }
      });
    });
  };

  const imageUrl = getEventImageUrl(eventState);
  const showPlaceholder = !imageUrl || imageFailed;
  const favorited = Boolean(optimisticEvent.isFavorited);

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
                  onOrganizerClick?.(eventState.createdBy);
                }}
                role={onOrganizerClick ? "button" : undefined}
                tabIndex={onOrganizerClick ? 0 : undefined}
                onKeyDown={(eventClick) => {
                  if (!onOrganizerClick) return;
                  if (eventClick.key === "Enter" || eventClick.key === " ") {
                    eventClick.preventDefault();
                    onOrganizerClick(eventState.createdBy);
                  }
                }}
              >
                <div className="social-event-card-organizer-avatar">
                  <UserAvatar user={eventState.createdBy} className="social-event-card-organizer-avatar-img" />
                </div>
                <div className="social-event-card-organizer-copy">
                  <span>
                    {eventState.createdBy?.username || "Organizer"}
                    <VerifiedBadge user={eventState.createdBy} />
                  </span>
                  <small>Organizer</small>
                </div>
              </div>
            </div>
          </div>
        </Link>

        <EventEngagementBar
          event={optimisticEvent}
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
        initialCommentCount={optimisticEvent.commentCount || 0}
        onCommentCountChange={(nextCount, nextEvent) => {
          startTransition(() => {
            updateOptimisticEvent({ commentCount: nextCount });
          });
          if (nextEvent) {
            syncEvent(nextEvent);
          } else {
            syncEvent({ ...eventState, commentCount: nextCount });
          }
        }}
      />
    </>
  );
}
