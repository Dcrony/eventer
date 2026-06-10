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
  Star,
  Flag,
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
import useReferralTracking from "../utils/useReferralTracking";
import ReviewForm from "../components/ReviewForm";
import RatingStats from "../components/RatingStats";
import ReviewCard from "../components/ReviewCard";
import { loadEventRatings, loadEventReviews } from "../utils/reputationUtils";
import {
  formatCurrency,
  formatEventDateRange,
  formatEventTimeRange,
  getEventImageUrl,
  getEventUrl,
} from "../utils/eventHelpers";
import useFeatureAccess from "../hooks/useFeatureAccess";
import ShareModal from "../components/WhatsAppShareModal";
import {
  canAccessAnalytics as canAccessEventAnalytics,
  canManageTeam as canManageEventTeam,
  canManageTickets as canManageEventTickets,
  canCheckIn as canCheckInEvent,
  canModerateLivestream as canManageEventLivestream,
} from "../utils/eventPermissions";

/* ─── Tier helpers ────────────────────────────────────────────────────────── */
const getTierDisplayName = (tier) => tier?.label?.trim() || tier?.type || "Ticket";
const getTierAccentColor = (tier) => tier?.color?.trim() || "#ec4899";
const isTierFree = (tier, isEventFree) => isEventFree || Boolean(tier?.isFree) || Number(tier?.price || 0) === 0;

/* ─── Derive a display-only lifecycle status from event dates ─────────────── */
// The stored eventLifecycleStatus may be "Published" for all live events.
// We compute the *display* state from actual dates so the UI badges and
// banners always reflect reality, while NOT blocking ticket purchase for
// legitimate upcoming/live events.
const deriveDisplayStatus = (event) => {
  if (!event) return null;
  const stored = event.eventLifecycleStatus;

  // Always honour these terminal / admin states from the server
  if (["Cancelled", "Suspended", "Ended", "Draft", "Pending Approval"].includes(stored)) {
    return stored;
  }

  // For Published / Upcoming / Live — recompute from dates so freshly
  // created events show the right badge without any server-side scheduler
  const now = new Date();
  const start = event.startDate ? new Date(event.startDate) : null;
  const end   = event.endDate   ? new Date(event.endDate)   : null;

  if (start && start > now) return "Upcoming";
  if (start && start <= now) {
    if (end && end < now) return "Ended";
    return "Live";
  }

  return stored || "Published";
};

function TicketTypeButton({ ticketType, isSelected, isEventFree, onClick }) {
  const displayName = getTierDisplayName(ticketType);
  const accentColor = getTierAccentColor(ticketType);
  const free = isTierFree(ticketType, isEventFree);
  const priceDisplay = free ? "Free" : formatCurrency(ticketType.price);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex justify-between items-center gap-3 p-3 rounded-lg border-2 text-left transition-all duration-200 hover:-translate-y-0.5 ${isSelected
        ? "border-pink-500 bg-pink-50 shadow-md"
        : "border-gray-200 bg-white hover:border-pink-200 hover:bg-pink-50/30"
        }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accentColor }} />
        <div className="space-y-0.5 min-w-0">
          <strong className="text-sm font-bold text-gray-900 block truncate">{displayName}</strong>
          {ticketType.description && (
            <span className="text-xs text-gray-400 block truncate">{ticketType.description}</span>
          )}
          {ticketType.maxPerOrder > 0 && (
            <span className="text-[0.6rem] text-gray-400 block">Max {ticketType.maxPerOrder} per order</span>
          )}
        </div>
      </div>
      <strong className="text-sm font-extrabold flex-shrink-0" style={{ color: isSelected ? accentColor : "#ec4899" }}>
        {priceDisplay}
      </strong>
    </button>
  );
}

/* ─── Component ───────────────────────────────────────────────────────────── */
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
  const [alreadyHasFreeTicket, setAlreadyHasFreeTicket] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [ratingStats, setRatingStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
    const [eventState, setEventState] = useState(event);
    const [organizerReputation, setOrganizerReputation] = useState(null);

  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isEventFree = event?.isFreeEvent || event?.isFree;

  const currentUserId = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      return u?._id || u?.id || null;
    } catch {
      return null;
    }
  })();

  const loadOrganizerReputation = async (organizerId) => {
  try {
    const { data } = await API.get(`/ratings/organizer/${organizerId}/reputation`);
    return data.reputation;
  } catch {
    return null;
  }
};

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
};

  // Only surface enabled tiers (server already filters, but defensive client check)
  const visiblePricing = useMemo(
    () => (event?.pricing || []).filter((t) => t.isEnabled !== false),
    [event]
  );

  // Derive display-only status from dates rather than trusting stored lifecycle
  const displayStatus = useMemo(() => deriveDisplayStatus(event), [event]);

  // ── Fetch event ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/events/${eventId}`);
        setEvent(data);

        // Select first visible tier
        const firstVisible = (data.pricing || []).find((t) => t.isEnabled !== false);
        setSelectedTicketType(
          firstVisible || (data.isFreeEvent || data.isFree ? { type: "Free", price: 0 } : null)
        );

        if ((data.isFreeEvent || data.isFree) && isLoggedIn) {
          try {
            const { data: myTickets } = await API.get("/tickets/my-tickets");
            const hasOne = myTickets.some(
              (t) =>
                String(t.event?._id || t.event) === String(data._id) &&
                t.isFree &&
                t.status !== "refunded" &&
                t.status !== "cancelled"
            );
            setAlreadyHasFreeTicket(hasOne);
          } catch { }
        }

        // Load event ratings and reviews
        loadEventRatings(data._id).then(setRatingStats);
        setReviewsLoading(true);
        loadEventReviews(data._id, 5).then(result => {
          setReviews(result.reviews);
          setReviewsLoading(false);
        });
      } catch (_) {
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  // ── Track view ───────────────────────────────────────────────────────────
  useEffect(() => {
    const trackView = async () => {
      const sessionKey = `event-view-${eventId}`;
      if (sessionStorage.getItem(sessionKey)) return;
      try {
        const { data } = await API.post(`/events/${eventId}/view`);
        setEvent(data);
        sessionStorage.setItem(sessionKey, "tracked");
      } catch { }
    };
    if (eventId) trackView();
  }, [eventId]);

  // ── Load event team ──────────────────────────────────────────────────────
  useEffect(() => {
    const loadEventTeam = async () => {
      if (!eventId) return;
      try {
        setTeamLoading(true);
        const { data } = await teamService.getEventTeam(eventId);
        setTeamMembers((data.members || []).filter((m) => m.isActive !== false));
        setTeamError("");
      } catch {
        setTeamError("Failed to load event team.");
        setTeamMembers([]);
      } finally {
        setTeamLoading(false);
      }
    };
    loadEventTeam();
  }, [eventId]);

  // ── Track referral clicks ────────────────────────────────────────────────
  const { recordConversion } = useReferralTracking(eventId);

  // ── Stream embed URL ─────────────────────────────────────────────────────
  const streamEmbedUrl = useMemo(() => {
    if (!event?.liveStream?.streamURL) return null;
    const rawUrl = String(event.liveStream.streamURL).trim();
    if (event.liveStream.streamType === "YouTube") {
      const match = rawUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      return match ? `https://www.youtube.com/embed/${match[1]}` : rawUrl;
    }
    if (event.liveStream.streamType === "Custom" || event.liveStream.streamType === "Facebook") {
      return rawUrl;
    }
    return null;
  }, [event]);

  // ── Derived values ───────────────────────────────────────────────────────
  const ticketStartingPrice = useMemo(() => {
    if (!visiblePricing.length) return "Free";
    const lowest = Math.min(...visiblePricing.map((t) => Number(t.price || 0)));
    return lowest > 0 ? formatCurrency(lowest) : "Free";
  }, [visiblePricing]);

  const imageUrl = useMemo(() => getEventImageUrl(event), [event]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleBuy = () => {
    if (!isLoggedIn) { navigate("/login"); return; }

    // Free if: whole event is free OR the selected tier is explicitly free OR price is 0
    const selectedIsFree =
      isEventFree ||
      selectedTicketType?.isFree ||
      Number(selectedTicketType?.price || 0) === 0;

    if (selectedIsFree) { reserveFreeTicket(); return; }

    if (!selectedTicketType) return;
    navigate(`/checkout/${event._id}`, {
      state: { event, quantity, ticketType: selectedTicketType.type, price: selectedTicketType.price, user },
    });
  };

  const reserveFreeTicket = async () => {
    try {
      await API.post("/tickets/create", {
        eventId: event._id,
        quantity: 1,
        ticketType: selectedTicketType?.type || "Free",
        isFree: true,
      });
      // Record referral conversion if visitor came from referral link
      recordConversion({ ticketCount: 1, revenue: 0 });
      toast.success("Ticket reserved successfully");
      setAlreadyHasFreeTicket(true);
      setEvent((cur) =>
        cur
          ? {
            ...cur,
            ticketsSold: Number(cur.ticketsSold || 0) + 1,
            totalTickets: Math.max(0, Number(cur.totalTickets || 0) - 1),
          }
          : cur
      );
      navigate("/my-tickets");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reserve ticket");
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    const nextLiked = !event.isLiked;
    const previousEvent = event;
    setEvent((cur) => ({
      ...cur,
      isLiked: nextLiked,
      likeCount: Math.max(0, Number(cur.likeCount || 0) + (nextLiked ? 1 : -1)),
    }));
    try {
      const { data } = await API.post(`/events/${event._id}/like`);
      setEvent(data);
    } catch {
      setEvent(previousEvent);
    }
  };

  const handleShare = () => setShareOpen(true);

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-geist">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 lg:p-6 mb-5">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
              <div className="rounded-xl bg-gray-100 min-h-[280px] lg:min-h-[340px]" />
              <div className="space-y-4">
                <div className="flex gap-2"><div className="h-9 w-28 rounded-full bg-gray-100" /><div className="h-9 w-28 rounded-full bg-gray-100" /></div>
                <div className="h-6 w-24 rounded-full bg-gray-100" />
                <div className="space-y-2"><div className="h-8 w-3/4 bg-gray-100 rounded-lg" /><div className="h-4 w-full bg-gray-100 rounded" /><div className="h-4 w-2/3 bg-gray-100 rounded" /></div>
                <div className="h-16 bg-gray-100 rounded-xl" />
                <div className="h-10 bg-gray-100 rounded-xl" />
              </div>
            </div>
          </div>
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 lg:p-6 space-y-6">
              <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg" />)}</div>
              <div className="space-y-2"><div className="h-4 w-full bg-gray-100 rounded" /><div className="h-4 w-5/6 bg-gray-100 rounded" /></div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 lg:p-6 space-y-4 h-fit">
              <div className="h-10 w-1/2 bg-gray-100 rounded-lg" />
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
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
        <Link to="/events"><Button>Return to events</Button></Link>
      </div>
    );
  }

  const remainingTickets = Number(event.totalTickets || 0);
  const showAnalyticsAction = canAccessEventAnalytics(event);
  const showTicketAction = canManageEventTickets(event);
  const showCheckInAction = canCheckInEvent(event);
  const showTeamAction = canManageEventTeam(event);
  const showLiveAction = canManageEventLivestream(event);
  const isSoldOut = remainingTickets <= 0;
  const freeTicketClaimed = (isEventFree || selectedTicketType?.isFree) && alreadyHasFreeTicket;

  // Use the computed display status for UI decisions.
  // IMPORTANT: "Upcoming" and "Live" and "Published" must NOT block ticket purchase —
  // only terminal or admin-blocked states should disable the buy button.
  const isEventLive      = displayStatus === "Live";
  const isEventUpcoming  = displayStatus === "Upcoming";
  const isEventEnded     = displayStatus === "Ended";
  const isEventCancelled = displayStatus === "Cancelled";
  const isEventSuspended = displayStatus === "Suspended";

  // Only block if the stored server status is explicitly pre-publish AND the
  // event is not yet approved. Approved events always allow ticket purchase.
  const isEventDraft =
    (event.eventLifecycleStatus === "Draft" ||
      event.eventLifecycleStatus === "Pending Approval") &&
    event.status !== "approved";

  const buyDisabled =
    isSoldOut ||
    freeTicketClaimed ||
    isEventEnded ||
    isEventCancelled ||
    isEventSuspended ||
    isEventDraft;

  const buyLabel = isEventEnded
    ? "Event ended"
    : isEventCancelled
      ? "Event cancelled"
      : isEventSuspended
        ? "Event unavailable"
        : isEventDraft
          ? "Event not available"
          : isSoldOut
            ? "Sold out"
            : freeTicketClaimed
              ? "Already reserved"
              : isEventUpcoming
                ? "Reserve tickets"
                : "Get tickets";

  return (
    <>
      <div className="min-h-screen bg-gray-50 font-geist">
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-6">
          <div className="space-y-5">

            {/* ── Hero Panel ─────────────────────────────────────────────── */}
            <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 lg:p-6 animate-fade-in-up">
              <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
                <div className="rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 min-h-[280px] lg:min-h-[340px]">
                  {imageUrl ? (
                    <img src={imageUrl} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-white/20 min-h-[280px] lg:min-h-[340px]">
                      <CalendarDays size={48} />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => navigate("/events")} className="text-sm">
                      <ArrowLeft size={16} /> Back to browse
                    </Button>
                    {showAnalyticsAction && (
                      <Link to={`/events/${event._id}/analytics`}><Button variant="secondary" className="text-sm">View analytics</Button></Link>
                    )}
                    {showTicketAction && (
                      <Link to={`/events/${event._id}/tickets`}><Button variant="secondary" className="text-sm">Manage tickets</Button></Link>
                    )}
                    {showCheckInAction && (
                      <Link to={`/events/${event._id}/tickets`}><Button variant="secondary" className="text-sm">Check-in dashboard</Button></Link>
                    )}
                    {showLiveAction && (
                      <Link to={`/live/${event._id}`}><Button variant="secondary" className="text-sm">{event.liveStream?.isLive ? "Open live controls" : "Open livestream"}</Button></Link>
                    )}
                    {showTeamAction && (
                      <Link to="/profile/me"><Button variant="secondary" className="text-sm">Manage team from profile</Button></Link>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {event.category && (
                      <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[0.65rem] font-bold uppercase bg-pink-50 text-pink-500 border border-pink-200">{event.category}</span>
                    )}
                    <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[0.65rem] font-bold uppercase bg-gray-50 text-gray-600 border border-gray-200">{event.eventType || "In-person"}</span>
                    {event.visibility === "private" && (
                      <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[0.65rem] font-bold uppercase bg-gray-50 text-gray-600 border border-gray-200"><ShieldCheck size={14} /> Private</span>
                    )}
                    {event.liveStream?.streamType && event.liveStream.streamType !== "Camera" && (
                      <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[0.65rem] font-bold uppercase bg-green-50 text-green-600 border border-green-200"><MonitorPlay size={14} /> Live stream ready</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* ── Event status banners ── */}

                    {/* Terminal / blocked states */}
                    {(isEventEnded || isEventCancelled || isEventSuspended) && (
                      <div className={`p-3 rounded-lg border text-sm font-semibold ${
                        isEventEnded
                          ? "bg-gray-100 border-gray-300 text-gray-700"
                          : isEventCancelled
                            ? "bg-red-50 border-red-300 text-red-700"
                            : "bg-yellow-50 border-yellow-300 text-yellow-700"
                      }`}>
                        {isEventEnded && "🏁 This event has ended."}
                        {isEventCancelled && `❌ This event has been cancelled.${event.cancellationReason ? ` Reason: ${event.cancellationReason}` : ""}`}
                        {isEventSuspended && `⚠️ This event is temporarily unavailable.${event.suspensionReason ? ` Reason: ${event.suspensionReason}` : ""}`}
                      </div>
                    )}

                    {/* Live NOW */}
                    {isEventLive && (
                      <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm font-semibold animate-pulse">
                        🔴 This event is LIVE NOW!
                      </div>
                    )}

                    {/* Upcoming — tickets are on sale */}
                    {isEventUpcoming && (
                      <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold">
                        🗓 Tickets on sale — event starts{" "}
                        {event.startDate
                          ? new Date(event.startDate).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "soon"}
                        {event.startTime ? ` at ${event.startTime}` : ""}
                      </div>
                    )}

                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-gray-900">{event.title}</h1>
                    <p className="text-sm text-gray-400 leading-relaxed">{event.description}</p>
                  </div>

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

                  <EventEngagementBar event={event} onLike={handleLike} onComment={() => setCommentsOpen(true)} onShare={handleShare} />
                </div>
              </div>
            </div>

            {/* ── Main Layout ─────────────────────────────────────────────── */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5">

              {/* Main Content */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 lg:p-6">
                <div className="space-y-6">
                  {/* Schedule */}
                  <section>
                    <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-pink-500 mb-3"><CalendarDays size={14} /> Schedule</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {[
                        { Icon: CalendarDays, label: "Date", value: formatEventDateRange(event.startDate, event.endDate) },
                        { Icon: Clock3, label: "Time", value: formatEventTimeRange(event.startTime, event.endTime) },
                        { Icon: MapPin, label: "Location", value: event.location || "Online event" },
                        { Icon: Users, label: "Community", value: `${event.ticketsSold || 0} attendees already in` },
                      ].map(({ Icon, label, value }) => (
                        <div key={label} className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 transition-all duration-200 hover:border-pink-200 hover:bg-pink-50">
                          <Icon size={18} className="text-pink-500 flex-shrink-0 mt-0.5" />
                          <div><strong className="block text-xs font-bold text-gray-900 mb-0.5">{label}</strong><span className="text-xs">{value}</span></div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Description */}
                  <section>
                    <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-pink-500 mb-3"><MessageSquare size={14} /> What to expect</span>
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

                  {/* Team */}
                  <section>
                    <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-pink-500 mb-3"><Users size={14} /> Event Team</span>
                    <div className="mt-2">
                      {teamLoading ? (
                        <p className="text-gray-400 text-sm">Loading team members...</p>
                      ) : teamError ? (
                        <p className="text-red-500 text-sm">{teamError}</p>
                      ) : teamMembers.length ? (
                        <div className="space-y-2">
                          {teamMembers.map((member) => (
                            <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 transition-all duration-200 hover:bg-gray-100">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                <UserAvatar user={member.user} className="w-full h-full object-cover" />
                              </div>
                              <div className="space-y-0.5">
                                <strong className="text-sm font-bold text-gray-900 block">{member.user?.name || member.user?.username || "Team Member"}</strong>
                                <span className="text-xs text-gray-400 block">{member.user?.email || "No email"}</span>
                                <small className="text-xs font-semibold text-pink-500 capitalize">{member.role.replace("_", " ")}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No team members have joined this event yet.</p>
                      )}
                    </div>
                  </section>

                  {/* Reviews Section */}
                  <section>
                    <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-pink-500 mb-3"><Star size={14} /> Reviews</span>

                    {ratingStats && <RatingStats stats={ratingStats} compact={false} />}

                    {user && String(user._id) !== String(event.createdBy?._id) && (
                      <div className="mt-4">
                        {!showReviewForm && (
                          <button
                            onClick={() => setShowReviewForm(true)}
                            className="w-full py-2 px-4 rounded-lg bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition-colors"
                          >
                            Leave a Review
                          </button>
                        )}

                        {showReviewForm && (
                          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                            <ReviewForm
                              targetType="event"
                              targetId={event._id}
                              eventId={event._id}
                              onSubmitSuccess={() => {
                                loadEventRatings(event._id).then(setRatingStats);
                                loadEventReviews(event._id, 5).then(r => setReviews(r.reviews));
                                setShowReviewForm(false);
                              }}
                              onCancel={() => setShowReviewForm(false)}
                              isOpen={showReviewForm}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 space-y-3">
                      {reviewsLoading ? (
                        <p className="text-gray-500 text-sm">Loading reviews...</p>
                      ) : reviews.length ? (
                        reviews.map(review => (
                          <ReviewCard key={review._id} review={review} />
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No reviews yet. Be the first to share your experience!</p>
                      )}
                    </div>
                  </section>

                  {/* Live Stream */}
                  {event.liveStream?.isLive && streamEmbedUrl && (
                    <section>
                      <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-pink-500 mb-3"><MonitorPlay size={14} /> Live Stream</span>
                      <div className="mt-2">
                        {canAccessLiveStreaming ? (
                          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900">
                            <iframe src={streamEmbedUrl} title="Live Stream" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full border-0 rounded-xl" />
                          </div>
                        ) : (
                          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-10">
                              <div className="text-center text-white p-6 max-w-[280px]">
                                <MonitorPlay size={48} className="mx-auto mb-4 opacity-80" />
                                <h3 className="text-xl font-semibold mb-2">Live Stream Available</h3>
                                <p className="text-sm mb-4 opacity-90">Upgrade to Pro to watch live streams.</p>
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

              {/* ── Sidebar ──────────────────────────────────────────────── */}
              <aside className="h-fit bg-white rounded-2xl border border-gray-200 p-4 shadow-sm sm:p-5 lg:sticky lg:top-6 lg:p-6">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-pink-500"><Ticket size={14} /> Tickets</span>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">{ticketStartingPrice}</h2>
                    <p className="text-xs text-gray-400 mt-1">Starting price for this event</p>
                  </div>

                  {/* Ticket type selector — only enabled tiers */}
                  <div className="space-y-2">
                    {visiblePricing.length ? (
                      visiblePricing.map((ticketType) => (
                        <TicketTypeButton
                          key={ticketType._id || ticketType.type}
                          ticketType={ticketType}
                          isSelected={selectedTicketType?.type === ticketType.type}
                          isEventFree={isEventFree}
                          onClick={() => setSelectedTicketType(ticketType)}
                        />
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

                  {/* Quantity selector */}
                  <div className="space-y-1">
                    <label htmlFor="event-quantity" className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Quantity</label>
                    <select
                      id="event-quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      disabled={isEventFree || selectedTicketType?.isFree}
                      className="w-full p-3 rounded-lg border-2 border-gray-200 bg-white text-sm text-gray-900 outline-none transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 appearance-none bg-no-repeat disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: "right 0.75rem center" }}
                    >

{(isEventFree || selectedTicketType?.isFree
  ? [1]
  : Array.from(
      {
        length: selectedTicketType?.maxPerOrder > 0
          ? Math.min(selectedTicketType.maxPerOrder, 10)
          : 5
      },
      (_, i) => i + 1
    )
).map((v) => (
  <option key={v} value={v}>{v}</option>
))}
                    </select>
                    {(isEventFree || selectedTicketType?.isFree) && (
                      <p className="text-[0.65rem] text-gray-400">Free tickets are limited to 1 per person.</p>
                    )}
                    {selectedTicketType?.maxPerOrder > 0 && !isEventFree && !selectedTicketType?.isFree && (
                      <p className="text-[0.65rem] text-gray-400">Max {selectedTicketType.maxPerOrder} per order.</p>
                    )}
                  </div>

                  {/* Availability stats */}
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

                  {/* Buy button */}
                  <button
                    type="button"
                    onClick={handleBuy}
                    disabled={buyDisabled}
                    className={`w-full flex items-center justify-center gap-2 h-12 rounded-full font-bold text-sm transition-all duration-200 ${buyDisabled
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-pink-500 text-white shadow-lg shadow-pink-500/30 hover:bg-pink-600 hover:-translate-y-0.5 hover:shadow-xl"
                      }`}
                  >
                    <Ticket size={18} />
                    {buyLabel}
                  </button>

                  {/* Trust badges */}
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400"><ShieldCheck size={14} className="text-green-500" />Secure checkout</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400"><ExternalLink size={14} className="text-green-500" />Instant confirmation</span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">
              {selectedTicketType ? getTierDisplayName(selectedTicketType) : "Tickets"}
            </div>
            <div className="truncate text-lg font-extrabold tracking-tight text-gray-900">
              {selectedTicketType
                ? (isEventFree || selectedTicketType.isFree ? "Free" : formatCurrency(selectedTicketType.price))
                : ticketStartingPrice}
            </div>
          </div>
          <button
            type="button"
            onClick={handleBuy}
            disabled={buyDisabled}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-all duration-200 ${buyDisabled ? "bg-gray-200 text-gray-400" : "bg-pink-500 text-white shadow-lg shadow-pink-500/25 hover:bg-pink-600"
              }`}
          >
            <Ticket size={18} />
            {buyLabel}
          </button>
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
          if (nextEvent) setEvent(nextEvent);
          else setEvent((cur) => ({ ...cur, commentCount: nextCount }));
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

// re-export helper for Checkout.jsx
export { getTierDisplayName };