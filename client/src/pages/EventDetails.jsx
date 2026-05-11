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
import teamService from "../services/api/team";
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
import useFeatureAccess from "../hooks/useFeatureAccess";
import "./CSS/eventdetail.css";
import ShareModal from "../components/ShareModal";

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const shareLink = useShareLink();
  const { toProfile } = useProfileNavigation();
  const toast = useToast();
  const { hasAccess: canAccessLiveStreaming, promptUpgrade: promptUpgradeLive } = useFeatureAccess("live_stream");
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState("");
  const [error, setError] = useState("");
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isEventFree = event?.isFreeEvent || event?.isFree;

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/events/${eventId}`);
        setEvent(data);
        setSelectedTicketType(data.pricing?.[0] || ((data.isFreeEvent || data.isFree) ? { type: "Free", price: 0 } : null));
      } catch (error) {
        setError("Failed to load event");
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
        // View tracking is non-critical - fail silently
      }
    };

    if (eventId) {
      trackView();
    }
  }, [eventId]);

  useEffect(() => {
    const loadEventTeam = async () => {
      if (!eventId || !isLoggedIn) return;

      try {
        setTeamLoading(true);
        const { data } = await teamService.getEventTeam(eventId);
        setTeamMembers(
  (data.members || []).filter(
    member => member.isActive !== false
  )
);
        setTeamError("");
      } catch (error) {
        if (error.response?.status === 403) {
          setTeamError("Team details are not available for this event.");
        } else {
          setTeamError("Failed to load event team.");
        }
        setTeamMembers([]);
      } finally {
        setTeamLoading(false);
      }
    };

    loadEventTeam();
  }, [eventId, isLoggedIn]);

  const streamEmbedUrl = useMemo(() => {
    if (!event?.liveStream?.streamURL) return null;
    const rawUrl = String(event.liveStream.streamURL).trim();

    if (event.liveStream.streamType === "YouTube") {
      const match = rawUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      return match ? `https://www.youtube.com/embed/${match[1]}` : rawUrl;
    }

    if (event.liveStream.streamType === "Custom") {
      return rawUrl;
    }

    if (event.liveStream.streamType === "Facebook") {
      return rawUrl;
    }

    return null;
  }, [event]);

  const ticketStartingPrice = useMemo(() => {
    if (!event?.pricing?.length) return "Free";
    const lowest = Math.min(...event.pricing.map((ticketType) => Number(ticketType.price || 0)));
    return lowest > 0 ? formatCurrency(lowest) : "Free";
  }, [event]);

  const imageUrl = useMemo(() => getEventImageUrl(event), [event]);

  const handleBuy = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (isEventFree) {
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
      setEvent(previousEvent);
    }
  };

  const handleShare = async () => {
    setShareOpen(true);


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
                {event.visibility === "private" ? (
                  <span className="event-detail-badge private">
                    <ShieldCheck size={14} />
                    Private
                  </span>
                ) : null}
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

                {isLoggedIn && (
                  <article>
                    <span className="section-eyebrow">
                      <Users size={14} />
                      Event Team
                    </span>
                    <div className="event-detail-copy-block">
                      {teamLoading ? (
                        <p>Loading team members...</p>
                      ) : teamError ? (
                        <p className="section-error">{teamError}</p>
                      ) : teamMembers.length ? (
                        <div className="event-team-list">
                          {teamMembers.map((member) => (
                            <div key={member.id} className="event-team-member">
                              <div className="event-team-avatar">
                                <UserAvatar user={member.user} className="event-team-avatar-img" />
                              </div>
                              <div className="event-team-details">
                                <strong>{member.user?.name || member.user?.username || "Team Member"}</strong>
                                <span>{member.user?.email || "No email"}</span>
                                <small>{member.role.replace("_", " ")}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No team members have joined this event yet.</p>
                      )}
                    </div>
                  </article>
                )}

                {event.liveStream?.isLive && streamEmbedUrl && (
                  <article>
                    <span className="section-eyebrow">
                      <MonitorPlay size={14} />
                      Live Stream
                    </span>
                    <div className="event-detail-copy-block">
                      {canAccessLiveStreaming ? (
                        <div className="live-stream-embed">
                          {event.liveStream.streamType === "YouTube" && (
                            <iframe
                              src={streamEmbedUrl}
                              title="Live Stream"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="live-stream-iframe"
                            ></iframe>
                          )}
                          {event.liveStream.streamType === "Custom" && (
                            <iframe
                              src={streamEmbedUrl}
                              title="Live Stream"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="live-stream-iframe"
                            ></iframe>
                          )}
                          {event.liveStream.streamType === "Facebook" && (
                            <div className="facebook-embed">
                              <iframe
                                src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(streamEmbedUrl)}&show_text=false`}
                                title="Live Stream"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="live-stream-iframe"
                              ></iframe>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="live-stream-locked">
                          <div className="blur-overlay">
                            <div className="blur-content">
                              <MonitorPlay size={48} />
                              <h3>Live Stream Available</h3>
                              <p>Upgrade to Pro to watch live streams from events.</p>
                              <Button onClick={promptUpgradeLive}>Upgrade Now</Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                )}
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
                        className={`event-detail-ticket-item ${selectedTicketType?.type === ticketType.type ? "is-active" : ""
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

                <Button
                  className="event-detail-buy-button"
                  onClick={handleBuy}
                  disabled={remainingTickets <= 0}
                >
                  <Ticket size={18} />
                  {remainingTickets > 0 ? "Get tickets" : "Sold out"}
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

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={event.title}
        url={getEventUrl(event._id)}
      />
    </>
  );
}
