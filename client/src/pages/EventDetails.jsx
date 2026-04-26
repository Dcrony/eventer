import { useEffect, useMemo, useState, startTransition } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  ExternalLink,
  Info,
  MapPin,
  MessageSquare,
  MonitorPlay,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import API from "../api/axios";
import Button from "../components/ui/button";
import EventCommentsModal from "../components/EventCommentsModal";
import EventEngagementBar from "../components/EventEngagementBar";
import VerifiedBadge from "../components/ui/verified-badge";
import { UserAvatar } from "../components/ui/avatar";
import { useToast } from "../components/ui/toast";
import useShareLink from "../hooks/useShareLink";
import useProfileNavigation from "../hooks/useProfileNavigation";
import {
  formatCurrency,
  formatEventDateRange,
  formatEventTimeRange,
  getEventImageUrl,
  getEventUrl,
} from "../utils/eventHelpers";
import "./CSS/eventdetail.css";

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const shareLink = useShareLink();
  const { toProfile } = useProfileNavigation();
  const toast = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/events/${eventId}`);
        setEvent(data);
        setSelectedTicketType(data.pricing?.[0] || (data.isFreeEvent ? { type: "Free", price: 0 } : null));
      } catch (error) {
        console.error("Failed to fetch event:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    const trackView = async () => {
      const sessionKey = `event-view-${eventId}`;
      if (sessionStorage.getItem(sessionKey)) return;

      try {
        const { data } = await API.post(`/events/${eventId}/view`);
        setEvent(data);
        sessionStorage.setItem(sessionKey, "tracked");
      } catch (error) {
        console.error("View tracking failed:", error);
      }
    };

    if (eventId) {
      trackView();
    }
  }, [eventId]);

  const ticketStartingPrice = useMemo(() => {
    if (!event?.pricing?.length) return "Free";
    const lowest = Math.min(...event.pricing.map((ticketType) => Number(ticketType.price || 0)));
    return lowest > 0 ? formatCurrency(lowest) : "Free";
  }, [event]);

  const handleBuy = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (event?.isFreeEvent) {
      reserveFreeTicket();
      return;
    }

    if (!selectedTicketType) return;

    navigate(`/checkout/${event._id}`, {
      state: {
        event,
        quantity,
        ticketType: selectedTicketType.type,
        price: selectedTicketType.price,
        user,
      },
    });
  };

  const reserveFreeTicket = async () => {
    try {
      await API.post("/tickets/create", {
        eventId: event._id,
        quantity,
        ticketType: selectedTicketType?.type || "Free",
        isFree: true,
        price: 0,
        amount: 0,
      });

      toast.success("Ticket reserved successfully");
      setEvent((current) =>
        current
          ? {
              ...current,
              ticketsSold: Number(current.ticketsSold || 0) + quantity,
              totalTickets: Math.max(0, Number(current.totalTickets || 0) - quantity),
            }
          : current,
      );
      navigate("/my-tickets");
    } catch (error) {
      console.error("Failed to reserve free ticket:", error);
      toast.error(error.response?.data?.message || "Failed to reserve ticket");
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    const nextLiked = !event.isLiked;
    const previousEvent = event;

    setEvent((current) => ({
      ...current,
      isLiked: nextLiked,
      likeCount: Math.max(0, Number(current.likeCount || 0) + (nextLiked ? 1 : -1)),
    }));

    try {
      const { data } = await API.post(`/events/${event._id}/like`);
      setEvent(data);
    } catch (error) {
      console.error("Failed to update like:", error);
      setEvent(previousEvent);
    }
  };

  const handleShare = async () => {
    const shared = await shareLink({
      title: event?.title,
      text: `Check out ${event?.title} on TickiSpot`,
      url: getEventUrl(event._id),
      copiedMessage: "Event link copied to clipboard",
    });

    if (!shared) return;

    startTransition(async () => {
      setEvent((current) => ({
        ...current,
        shareCount: Number(current.shareCount || 0) + 1,
      }));

      try {
        const { data } = await API.post(`/events/${event._id}/share`);
        setEvent(data);
      } catch (error) {
        console.error("Failed to track share:", error);
      }
    });
  };

  if (loading) {
    return (
      <div className="event-detail-state">
        <div className="event-detail-spinner" />
        <p>Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-detail-state">
        <Info size={38} />
        <p>Event not found</p>
        <Link to="/events">
          <Button>Return to events</Button>
        </Link>
      </div>
    );
  }

  const imageUrl = getEventImageUrl(event);
  const remainingTickets = Number(event.totalTickets || 0);

  return (
    <>
      <div className="dashboard-page">
        <div className="dashboard-container event-detail-page">
          <div className="event-detail-hero glass-panel">
            <div className="event-detail-hero-media">
              {imageUrl ? (
                <img src={imageUrl} alt={event.title} />
              ) : (
                <div className="event-detail-hero-placeholder">
                  <CalendarDays size={48} />
                </div>
              )}
            </div>

            <div className="event-detail-hero-copy">
              <div className="event-detail-hero-actions">
                <Button variant="secondary" onClick={() => navigate("/events")}>
                  <ArrowLeft size={16} />
                  Back to browse
                </Button>
                {event.createdBy?._id === user?._id || event.createdBy?._id === user?.id ? (
                  <Link to={`/events/${event._id}/analytics`}>
                    <Button variant="secondary">View analytics</Button>
                  </Link>
                ) : null}
              </div>

              <div className="event-detail-badges">
                {event.category ? <span className="event-detail-badge">{event.category}</span> : null}
                <span className="event-detail-badge outline">{event.eventType || "In-person"}</span>
                {event.liveStream?.streamType && event.liveStream.streamType !== "Camera" ? (
                  <span className="event-detail-badge live">
                    <MonitorPlay size={14} />
                    Live stream ready
                  </span>
                ) : null}
              </div>

              <div className="event-detail-heading">
                <h1>{event.title}</h1>
                <p>{event.description}</p>
              </div>

              <div className="event-detail-organizer" onClick={() => toProfile(event.createdBy)}>
                <div className="event-detail-organizer-avatar">
                  <UserAvatar user={event.createdBy} className="event-detail-organizer-avatar-img" />
                </div>
                <div>
                  <span>
                    {event.createdBy?.name || event.createdBy?.username || "Organizer"}
                    <VerifiedBadge user={event.createdBy} />
                  </span>
                  <small>@{event.createdBy?.username || "tickispot"}</small>
                </div>
              </div>

              <EventEngagementBar
                event={event}
                onLike={handleLike}
                onComment={() => setCommentsOpen(true)}
                onShare={handleShare}
              />
            </div>
          </div>

          <div className="event-detail-layout">
            <section className="event-detail-main glass-panel">
              <div className="event-detail-grid">
                <article>
                  <span className="section-eyebrow">
                    <CalendarDays size={14} />
                    Schedule
                  </span>
                  <div className="event-detail-facts">
                    <div>
                      <CalendarDays size={18} />
                      <div>
                        <strong>Date</strong>
                        <span>{formatEventDateRange(event.startDate, event.endDate)}</span>
                      </div>
                    </div>
                    <div>
                      <Clock3 size={18} />
                      <div>
                        <strong>Time</strong>
                        <span>{formatEventTimeRange(event.startTime, event.endTime)}</span>
                      </div>
                    </div>
                    <div>
                      <MapPin size={18} />
                      <div>
                        <strong>Location</strong>
                        <span>{event.location || "Online event"}</span>
                      </div>
                    </div>
                    <div>
                      <Users size={18} />
                      <div>
                        <strong>Community</strong>
                        <span>{event.ticketsSold || 0} attendees already in</span>
                      </div>
                    </div>
                  </div>
                </article>

                <article>
                  <span className="section-eyebrow">
                    <MessageSquare size={14} />
                    What to expect
                  </span>
                  <div className="event-detail-copy-block">
                    <p>{event.description}</p>
                    {event.requirements ? (
                      <div className="event-detail-note">
                        <Info size={16} />
                        <span>{event.requirements}</span>
                      </div>
                    ) : null}
                  </div>
                </article>
              </div>
            </section>

            <aside className="event-detail-sidebar glass-panel">
              <div className="event-detail-sidebar-card">
                <span className="section-eyebrow">
                  <Ticket size={14} />
                  Tickets
                </span>
                <h2>{ticketStartingPrice}</h2>
                <p>Starting price for this event</p>

                <div className="event-detail-ticket-list">
                  {event.pricing?.length ? (
                    event.pricing.map((ticketType) => (
                      <button
                        key={ticketType._id || ticketType.type}
                        type="button"
                        className={`event-detail-ticket-item ${
                          selectedTicketType?.type === ticketType.type ? "is-active" : ""
                        }`}
                        onClick={() => setSelectedTicketType(ticketType)}
                      >
                        <div>
                          <strong>{ticketType.type}</strong>
                          <span>{ticketType.benefits || "Access to the event experience"}</span>
                        </div>
                        <strong>{ticketType.price > 0 ? formatCurrency(ticketType.price) : "Free"}</strong>
                      </button>
                    ))
                  ) : (
                    <div className="event-detail-ticket-item is-static">
                      <div>
                        <strong>Free admission</strong>
                        <span>Reserve your spot instantly.</span>
                      </div>
                      <strong>Free</strong>
                    </div>
                  )}
                </div>

                <div className="event-detail-purchase-row">
                  <label htmlFor="event-quantity">Quantity</label>
                  <select
                    id="event-quantity"
                    value={quantity}
                    onChange={(selected) => setQuantity(Number(selected.target.value))}
                  >
                    {[1, 2, 3, 4, 5].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="event-detail-availability">
                  <div>
                    <strong>{remainingTickets}</strong>
                    <span>tickets remaining</span>
                  </div>
                  <div>
                    <strong>{event.ticketsSold || 0}</strong>
                    <span>tickets sold</span>
                  </div>
                </div>

                <Button className="event-detail-buy-button" onClick={handleBuy}>
                  <Ticket size={18} />
                  Get tickets
                </Button>

                <div className="event-detail-support-points">
                  <span>
                    <ShieldCheck size={16} />
                    Secure checkout
                  </span>
                  <span>
                    <ExternalLink size={16} />
                    Instant confirmation
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <EventCommentsModal
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        eventId={event._id}
        eventTitle={event.title}
        initialComments={event.comments || []}
        initialCommentCount={event.commentCount || 0}
        onCommentCountChange={(nextCount, nextEvent) => {
          if (nextEvent) {
            setEvent(nextEvent);
          } else {
            setEvent((current) => ({ ...current, commentCount: nextCount }));
          }
        }}
      />
    </>
  );
}
