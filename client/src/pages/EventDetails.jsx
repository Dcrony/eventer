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
import ShareModal from "../components/ShareModal";
import {
  canAccessAnalytics as canAccessEventAnalytics,
  canManageTeam as canManageEventTeam,
  canManageTickets as canManageEventTickets,
  canModerateLivestream as canManageEventLivestream,
} from "../utils/eventPermissions";

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
      if (!eventId) return;

      try {
        setTeamLoading(true);
        const { data } = await teamService.getEventTeam(eventId);

        setTeamMembers(
          (data.members || []).filter(member => member.isActive !== false)
        );

        setTeamError("");
      } catch (error) {
        setTeamError("Failed to load event team.");
        setTeamMembers([]);
      } finally {
        setTeamLoading(false);
      }
    };

    loadEventTeam();
  }, [eventId]);

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
    <div className="min-h-screen bg-gray-50 font-geist lg:pl-[var(--sidebar-width,0px)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse">
        {/* Hero panel skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 lg:p-6 mb-5">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-gray-100 min-h-[280px] lg:min-h-[340px]" />
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="h-9 w-28 rounded-full bg-gray-100" />
                <div className="h-9 w-28 rounded-full bg-gray-100" />
              </div>
              <div className="h-6 w-24 rounded-full bg-gray-100" />
              <div className="space-y-2">
                <div className="h-8 w-3/4 bg-gray-100 rounded-lg" />
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-2/3 bg-gray-100 rounded" />
              </div>
              <div className="h-16 bg-gray-100 rounded-xl" />
              <div className="h-10 bg-gray-100 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 lg:p-6 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg" />
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
              <div className="h-4 w-4/6 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 lg:p-6 space-y-4 h-fit">
            <div className="h-10 w-1/2 bg-gray-100 rounded-lg" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl" />
              ))}
            </div>
            <div className="h-12 bg-gray-100 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

  if (!event) {
    return (
      <div className="min-h-[65vh] grid place-items-center gap-3 text-center text-gray-400 font-geist">
        <Info size={38} />
        <p className="text-sm">Event not found</p>
        <Link to="/events">
          <Button>Return to events</Button>
        </Link>
      </div>
    );
  }

  const remainingTickets = Number(event.totalTickets || 0);
  const showAnalyticsAction = canAccessEventAnalytics(event);
  const showTicketAction = canManageEventTickets(event);
  const showTeamAction = canManageEventTeam(event);
  const showLiveAction = canManageEventLivestream(event);

  return (
    <>
      <div className="min-h-screen bg-gray-50 font-geist lg:pl-[var(--sidebar-width,0px)] transition-all duration-300">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-5">
            {/* Hero Panel */}
            <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 lg:p-6 animate-fade-in-up">
              <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
                {/* Hero Image */}
                <div className="rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 min-h-[280px] lg:min-h-[340px]">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-white/20 min-h-[280px] lg:min-h-[340px]">
                      <CalendarDays size={48} />
                    </div>
                  )}
                </div>

                {/* Hero Content */}
                <div className="space-y-4">
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => navigate("/events")} className="text-sm">
                      <ArrowLeft size={16} /> Back to browse
                    </Button>
                    {showAnalyticsAction && (
                      <Link to={`/events/${event._id}/analytics`}>
                        <Button variant="secondary" className="text-sm">View analytics</Button>
                      </Link>
                    )}
                    {showTicketAction && (
                      <Link to={`/events/${event._id}/tickets`}>
                        <Button variant="secondary" className="text-sm">Manage tickets</Button>
                      </Link>
                    )}
                    {showLiveAction && (
                      <Link to={`/live/${event._id}`}>
                        <Button variant="secondary" className="text-sm">
                          {event.liveStream?.isLive ? "Open live controls" : "Open livestream"}
                        </Button>
                      </Link>
                    )}
                    {showTeamAction && (
                      <Link to={`/profile/me`}>
                        <Button variant="secondary" className="text-sm">Manage team from profile</Button>
                      </Link>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {event.category && (
                      <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[0.65rem] font-bold uppercase bg-pink-50 text-pink-500 border border-pink-200">
                        {event.category}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[0.65rem] font-bold uppercase bg-gray-50 text-gray-600 border border-gray-200">
                      {event.eventType || "In-person"}
                    </span>
                    {event.visibility === "private" && (
                      <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[0.65rem] font-bold uppercase bg-gray-50 text-gray-600 border border-gray-200">
                        <ShieldCheck size={14} /> Private
                      </span>
                    )}
                    {event.liveStream?.streamType && event.liveStream.streamType !== "Camera" && (
                      <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[0.65rem] font-bold uppercase bg-green-50 text-green-600 border border-green-200">
                        <MonitorPlay size={14} /> Live stream ready
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-gray-900">
                      {event.title}
                    </h1>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  {/* Organizer */}
                  <div
                    onClick={() => toProfile(event.createdBy)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer transition-all duration-200 hover:bg-pink-50 hover:border-pink-200"
                  >
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-200 border border-gray-200 flex-shrink-0">
                      <UserAvatar user={event.createdBy} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center gap-1.5 font-bold text-sm text-gray-900">
                        {event.createdBy?.name || event.createdBy?.username || "Organizer"}
                        <VerifiedBadge user={event.createdBy} />
                      </span>
                      <small className="block text-xs text-gray-400">@{event.createdBy?.username || "tickispot"}</small>
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
            </div>

            {/* Main Layout */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5">
              {/* Main Content */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 lg:p-6">
                <div className="space-y-6">
                  {/* Schedule Section */}
                  <section>
                    <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-pink-500 mb-3">
                      <CalendarDays size={14} /> Schedule
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {[
                        { Icon: CalendarDays, label: "Date", value: formatEventDateRange(event.startDate, event.endDate) },
                        { Icon: Clock3, label: "Time", value: formatEventTimeRange(event.startTime, event.endTime) },
                        { Icon: MapPin, label: "Location", value: event.location || "Online event" },
                        { Icon: Users, label: "Community", value: `${event.ticketsSold || 0} attendees already in` },
                      ].map(({ Icon, label, value }) => (
                        <div
                          key={label}
                          className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 transition-all duration-200 hover:border-pink-200 hover:bg-pink-50"
                        >
                          <Icon size={18} className="text-pink-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-xs font-bold text-gray-900 mb-0.5">{label}</strong>
                            <span className="text-xs">{value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Description Section */}
                  <section>
                    <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-pink-500 mb-3">
                      <MessageSquare size={14} /> What to expect
                    </span>
                    <div className="space-y-3 text-gray-400 text-sm leading-relaxed mt-2">
                      <p>{event.description}</p>
                      {event.requirements && (
                        <div className="flex gap-2 p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-gray-600 text-xs">
                          <Info size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{event.requirements}</span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Team Section */}
                  <section>
                    <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-pink-500 mb-3">
                      <Users size={14} /> Event Team
                    </span>
                    <div className="mt-2">
                      {teamLoading ? (
                        <p className="text-gray-400 text-sm">Loading team members...</p>
                      ) : teamError ? (
                        <p className="text-red-500 text-sm">{teamError}</p>
                      ) : teamMembers.length ? (
                        <div className="space-y-2">
                          {teamMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 transition-all duration-200 hover:bg-gray-100"
                            >
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                <UserAvatar user={member.user} className="w-full h-full object-cover" />
                              </div>
                              <div className="space-y-0.5">
                                <strong className="text-sm font-bold text-gray-900 block">
                                  {member.user?.name || member.user?.username || "Team Member"}
                                </strong>
                                <span className="text-xs text-gray-400 block">{member.user?.email || "No email"}</span>
                                <small className="text-xs font-semibold text-pink-500 capitalize">
                                  {member.role.replace("_", " ")}
                                </small>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No team members have joined this event yet.</p>
                      )}
                    </div>
                  </section>

                  {/* Live Stream Section */}
                  {event.liveStream?.isLive && streamEmbedUrl && (
                    <section>
                      <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-pink-500 mb-3">
                        <MonitorPlay size={14} /> Live Stream
                      </span>
                      <div className="mt-2">
                        {canAccessLiveStreaming ? (
                          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900">
                            <iframe
                              src={streamEmbedUrl}
                              title="Live Stream"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full border-0 rounded-xl"
                            />
                          </div>
                        ) : (
                          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-10">
                              <div className="text-center text-white p-6 max-w-[280px]">
                                <MonitorPlay size={48} className="mx-auto mb-4 opacity-80" />
                                <h3 className="text-xl font-semibold mb-2">Live Stream Available</h3>
                                <p className="text-sm mb-4 opacity-90">Upgrade to Pro to watch live streams from events.</p>
                                <Button onClick={promptUpgradeLive} className="text-sm">Upgrade Now</Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <aside className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 lg:p-6 h-fit">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-pink-500">
                    <Ticket size={14} /> Tickets
                  </span>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                      {ticketStartingPrice}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Starting price for this event</p>
                  </div>

                  {/* Ticket Types */}
                  <div className="space-y-2">
                    {event.pricing?.length ? (
                      event.pricing.map((ticketType) => (
                        <button
                          key={ticketType._id || ticketType.type}
                          type="button"
                          onClick={() => setSelectedTicketType(ticketType)}
                          className={`w-full flex justify-between items-center gap-3 p-3 rounded-lg border-2 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                            selectedTicketType?.type === ticketType.type
                              ? "border-pink-500 bg-pink-50 shadow-md"
                              : "border-gray-200 bg-white hover:border-pink-200 hover:bg-pink-50/30"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <strong className="text-sm font-bold text-gray-900 block">{ticketType.type}</strong>
                            <span className="text-xs text-gray-400 block">
                              {ticketType.benefits || "Access to the event experience"}
                            </span>
                          </div>
                          <strong className="text-sm font-extrabold text-pink-500 flex-shrink-0">
                            {ticketType.price > 0 ? formatCurrency(ticketType.price) : "Free"}
                          </strong>
                        </button>
                      ))
                    ) : (
                      <div className="flex justify-between items-center gap-3 p-3 rounded-lg border-2 border-gray-200 bg-white">
                        <div className="space-y-0.5">
                          <strong className="text-sm font-bold text-gray-900 block">Free admission</strong>
                          <span className="text-xs text-gray-400 block">Reserve your spot instantly.</span>
                        </div>
                        <strong className="text-sm font-extrabold text-pink-500">Free</strong>
                      </div>
                    )}
                  </div>

                  {/* Quantity Selector */}
                  <div className="space-y-1">
                    <label htmlFor="event-quantity" className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">
                      Quantity
                    </label>
                    <select
                      id="event-quantity"
                      value={quantity}
                      onChange={(selected) => setQuantity(Number(selected.target.value))}
                      className="w-full p-3 rounded-lg border-2 border-gray-200 bg-white text-sm text-gray-900 outline-none transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 appearance-none bg-no-repeat bg-right-3"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundPosition: "right 0.75rem center",
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  {/* Availability Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <strong className="block text-lg font-extrabold tracking-tight text-gray-900">{remainingTickets}</strong>
                      <span className="text-[0.65rem] font-medium text-gray-400">tickets remaining</span>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <strong className="block text-lg font-extrabold tracking-tight text-gray-900">{event.ticketsSold || 0}</strong>
                      <span className="text-[0.65rem] font-medium text-gray-400">tickets sold</span>
                    </div>
                  </div>

                  {/* Buy Button */}
                  <button
                    type="button"
                    onClick={handleBuy}
                    disabled={remainingTickets <= 0}
                    className={`w-full flex items-center justify-center gap-2 h-12 rounded-full font-bold text-sm transition-all duration-200 ${
                      remainingTickets > 0
                        ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30 hover:bg-pink-600 hover:-translate-y-0.5 hover:shadow-xl"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Ticket size={18} />
                    {remainingTickets > 0 ? "Get tickets" : "Sold out"}
                  </button>

                  {/* Trust Badges */}
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                      <ShieldCheck size={14} className="text-green-500" /> Secure checkout
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                      <ExternalLink size={14} className="text-green-500" /> Instant confirmation
                    </span>
                  </div>
                </div>
              </aside>
            </div>
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
