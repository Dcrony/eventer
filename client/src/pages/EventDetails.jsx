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
  ChevronRight,
  Zap,
  Heart,
  Share2,
  Play,
  Lock,
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

/* ─── Tier helpers ───────────────────────────────────────────────────────── */
const getTierDisplayName = (tier) => tier?.label?.trim() || tier?.type || "Ticket";
const getTierAccentColor = (tier) => tier?.color?.trim() || "#ec4899";
const isTierFree = (tier, isEventFree) =>
  isEventFree || Boolean(tier?.isFree) || Number(tier?.price || 0) === 0;

/* ─── Derive display lifecycle from dates ────────────────────────────────── */
const deriveDisplayStatus = (event) => {
  if (!event) return null;
  const stored = event.eventLifecycleStatus;
  if (["Cancelled", "Suspended", "Ended", "Draft", "Pending Approval"].includes(stored))
    return stored;
  const now = new Date();
  const start = event.startDate ? new Date(event.startDate) : null;
  const end = event.endDate ? new Date(event.endDate) : null;
  if (start && start > now) return "Upcoming";
  if (start && start <= now) {
    if (end && end < now) return "Ended";
    return "Live";
  }
  return stored || "Published";
};

/* ─── Status pill ────────────────────────────────────────────────────────── */
function StatusPill({ status }) {
  const map = {
    Live:     { bg: "bg-red-500",     text: "text-white",      dot: true,  label: "Live now"   },
    Upcoming: { bg: "bg-blue-50",     text: "text-blue-600",   dot: false, label: "Upcoming"   },
    Ended:    { bg: "bg-gray-100",    text: "text-gray-500",   dot: false, label: "Ended"      },
    Cancelled:{ bg: "bg-red-50",      text: "text-red-600",    dot: false, label: "Cancelled"  },
    Suspended:{ bg: "bg-amber-50",    text: "text-amber-700",  dot: false, label: "Suspended"  },
    Published:{ bg: "bg-emerald-50",  text: "text-emerald-700",dot: false, label: "Published"  },
  };
  const s = map[status] || map.Published;
  return (
    <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[0.6rem] font-black uppercase tracking-wider ${s.bg} ${s.text}`}>
      {s.dot && <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />}
      {s.label}
    </span>
  );
}

/* ─── Ticket tier card ───────────────────────────────────────────────────── */
function TicketTypeButton({ ticketType, event, isSelected, isEventFree, quantity, onSelect, onQuantityChange, buyDisabled }) {
  const displayName = getTierDisplayName(ticketType);
  const accentColor = getTierAccentColor(ticketType);
  const free = isTierFree(ticketType, isEventFree);
  const priceDisplay = free ? "Free" : formatCurrency(ticketType.price);
  const groupSize = Number(ticketType.groupSize || 1);
  const maxPerOrder = free ? 1 : Number(ticketType.maxPerOrder || 0);
  const qtyLimit = free ? 1 : maxPerOrder > 0 ? Math.min(maxPerOrder, 10) : 5;
  const quantityValue = isSelected ? quantity : Math.min(quantity, qtyLimit);
  const availableTickets = Number(ticketType.availableQuantity ?? event?.totalTickets ?? 0);

  const remainingLabel =
    availableTickets <= 0
      ? "Sold out"
      : availableTickets <= 20
      ? `Only ${availableTickets} left`
      : `${availableTickets} available`;

  const deadlineDate = ticketType.saleEndDate ? new Date(ticketType.saleEndDate) : null;
  const increaseDate = ticketType.priceIncreaseDate ? new Date(ticketType.priceIncreaseDate) : null;
  const fmtDate = (d) =>
    d && !isNaN(d.getTime())
      ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : null;
  const saleDeadline = deadlineDate && deadlineDate > new Date() ? fmtDate(deadlineDate) : null;
  const priceIncrease = increaseDate && increaseDate > new Date() ? fmtDate(increaseDate) : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
        isSelected
          ? "border-pink-500 bg-pink-50/60 shadow-md shadow-pink-500/10"
          : "border-gray-200 bg-white hover:border-pink-300 hover:bg-pink-50/30"
      }`}
    >
      {/* Top row: name + price */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            />
            <span className="text-base font-black text-gray-900 truncate">{displayName}</span>
            {isSelected && (
              <span className="inline-flex items-center h-5 px-2 rounded-full bg-pink-500 text-white text-[0.55rem] font-black uppercase tracking-wider">
                Selected
              </span>
            )}
          </div>
          {ticketType.description && (
            <p className="text-xs text-gray-500 leading-relaxed">{ticketType.description}</p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-2xl font-black tracking-tight text-gray-900">{priceDisplay}</div>
          <div className="text-[0.6rem] uppercase tracking-wider text-gray-400 mt-0.5">
            {free ? "no charge" : "per ticket"}
          </div>
        </div>
      </div>

      {/* Benefits */}
      {ticketType.benefits && (
        <div className="mb-3 rounded-xl border border-pink-100 bg-pink-50/50 px-3.5 py-2.5">
          <p className="text-[0.6rem] font-black uppercase tracking-wider text-pink-500 mb-1">Benefits</p>
          <p className="text-xs text-gray-700 leading-relaxed">{ticketType.benefits}</p>
        </div>
      )}

      {/* Meta chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`inline-flex h-6 px-2.5 items-center rounded-full text-[0.6rem] font-bold ${
          availableTickets <= 0
            ? "bg-red-50 text-red-600"
            : availableTickets <= 20
            ? "bg-amber-50 text-amber-700"
            : "bg-gray-100 text-gray-600"
        }`}>
          {remainingLabel}
        </span>
        {groupSize > 1 && (
          <span className="inline-flex h-6 px-2.5 items-center rounded-full bg-gray-100 text-[0.6rem] font-bold text-gray-600">
            {groupSize} per group
          </span>
        )}
        {saleDeadline && (
          <span className="inline-flex h-6 px-2.5 items-center rounded-full bg-rose-50 text-[0.6rem] font-bold text-rose-600">
            Sale ends {saleDeadline}
          </span>
        )}
        {priceIncrease && (
          <span className="inline-flex h-6 px-2.5 items-center rounded-full bg-amber-50 text-[0.6rem] font-bold text-amber-700">
            Price up {priceIncrease}
          </span>
        )}
        {ticketType.isRefundable && (
          <span className="inline-flex h-6 px-2.5 items-center rounded-full bg-emerald-50 text-[0.6rem] font-bold text-emerald-700">
            Refundable
          </span>
        )}
        {ticketType.isTransferable && (
          <span className="inline-flex h-6 px-2.5 items-center rounded-full bg-cyan-50 text-[0.6rem] font-bold text-cyan-700">
            Transferable
          </span>
        )}
        {free && (
          <span className="inline-flex h-6 px-2.5 items-center rounded-full bg-emerald-50 text-[0.6rem] font-bold text-emerald-700">
            Free admission
          </span>
        )}
      </div>

      {/* Quantity */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
        <label className="text-[0.6rem] font-black uppercase tracking-wider text-gray-400">Quantity</label>
        <select
          value={quantityValue}
          disabled={!isSelected || buyDisabled}
          onFocus={() => !isSelected && onSelect()}
          onChange={(e) => {
            if (!isSelected) onSelect();
            onQuantityChange(Number(e.target.value));
          }}
          className="h-8 px-3 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {Array.from({ length: qtyLimit }, (_, i) => i + 1).map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>
    </button>
  );
}

/* ─── Info chip ──────────────────────────────────────────────────────────── */
function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5 transition-colors hover:border-pink-200 hover:bg-pink-50/30">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm">
        <Icon size={14} className="text-pink-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[0.55rem] font-black uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
        <p className="text-xs font-semibold text-gray-900 leading-snug">{value}</p>
      </div>
    </div>
  );
}

/* ─── Section label ──────────────────────────────────────────────────────── */
function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-50">
        <Icon size={12} className="text-pink-500" />
      </div>
      <span className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400">{children}</span>
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const shareLink = useShareLink();
  const { toProfile } = useProfileNavigation();
  const toast = useToast();
  const { hasAccess: canAccessLiveStreaming, promptUpgrade: promptUpgradeLive } =
    useFeatureAccess("live_stream");

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
  const [eventState, setEventState] = useState(null);
  const [organizerReputation, setOrganizerReputation] = useState(null);

  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isEventFree = event?.isFreeEvent || event?.isFree;

  const currentUserId = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      return u?._id || u?.id || null;
    } catch { return null; }
  })();

  const loadOrganizerReputation = async (organizerId) => {
    try {
      const { data } = await API.get(`/ratings/organizer/${organizerId}/reputation`);
      return data.reputation;
    } catch { return null; }
  };

  useEffect(() => { setEventState(event); }, [event]);
  useEffect(() => {
    if (event?.createdBy?._id)
      loadOrganizerReputation(event.createdBy._id).then(setOrganizerReputation);
  }, [event?.createdBy?._id]);

  const visiblePricing = useMemo(
    () => (event?.pricing || []).filter((t) => t.isEnabled !== false),
    [event]
  );

  const displayStatus = useMemo(() => deriveDisplayStatus(event), [event]);

  /* ── Fetch ── */
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/events/${eventId}`);
        setEvent(data);
        const firstVisible = (data.pricing || []).find((t) => t.isEnabled !== false);
        setSelectedTicketType(
          firstVisible || (data.isFreeEvent || data.isFree ? { type: "Free", price: 0 } : null)
        );
        if ((data.isFreeEvent || data.isFree) && isLoggedIn) {
          try {
            const { data: myTickets } = await API.get("/tickets/my-tickets");
            setAlreadyHasFreeTicket(
              myTickets.some(
                (t) =>
                  String(t.event?._id || t.event) === String(data._id) &&
                  t.isFree &&
                  t.status !== "refunded" &&
                  t.status !== "cancelled"
              )
            );
          } catch {}
        }
        loadEventRatings(data._id).then(setRatingStats);
        setReviewsLoading(true);
        loadEventReviews(data._id, 5).then((r) => {
          setReviews(r.reviews);
          setReviewsLoading(false);
        });
      } catch { setError("Failed to load event"); }
      finally { setLoading(false); }
    };
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    const trackView = async () => {
      const key = `event-view-${eventId}`;
      if (sessionStorage.getItem(key)) return;
      try {
        const { data } = await API.post(`/events/${eventId}/view`);
        setEvent(data);
        sessionStorage.setItem(key, "tracked");
      } catch {}
    };
    if (eventId) trackView();
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    setTeamLoading(true);
    teamService
      .getEventTeam(eventId)
      .then(({ data }) => {
        setTeamMembers((data.members || []).filter((m) => m.isActive !== false));
        setTeamError("");
      })
      .catch(() => { setTeamError("Failed to load team."); setTeamMembers([]); })
      .finally(() => setTeamLoading(false));
  }, [eventId]);

  const { recordConversion } = useReferralTracking(eventId);

  const streamEmbedUrl = useMemo(() => {
    if (!event?.liveStream?.streamURL) return null;
    const raw = String(event.liveStream.streamURL).trim();
    if (event.liveStream.streamType === "YouTube") {
      const m = raw.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      return m ? `https://www.youtube.com/embed/${m[1]}` : raw;
    }
    return raw;
  }, [event]);

  const ticketStartingPrice = useMemo(() => {
    if (!visiblePricing.length) return "Free";
    const lowest = Math.min(...visiblePricing.map((t) => Number(t.price || 0)));
    return lowest > 0 ? formatCurrency(lowest) : "Free";
  }, [visiblePricing]);

  const imageUrl = useMemo(() => getEventImageUrl(event), [event]);

  /* ── Handlers ── */
  const handleBuy = () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    const selectedIsFree =
      isEventFree || selectedTicketType?.isFree || Number(selectedTicketType?.price || 0) === 0;
    if (selectedIsFree) { reserveFreeTicket(); return; }
    if (!selectedTicketType) return;
    navigate(`/checkout/${event._id}`, {
      state: { event, quantity, ticketType: selectedTicketType.type, price: selectedTicketType.price, user },
    });
  };

  const reserveFreeTicket = async () => {
    try {
      await API.post("/tickets/create", {
        eventId: event._id, quantity: 1,
        ticketType: selectedTicketType?.type || "Free", isFree: true,
      });
      recordConversion({ ticketCount: 1, revenue: 0 });
      toast.success("Ticket reserved!");
      setAlreadyHasFreeTicket(true);
      setEvent((c) => c ? { ...c, ticketsSold: Number(c.ticketsSold||0)+1, totalTickets: Math.max(0,Number(c.totalTickets||0)-1) } : c);
      navigate("/my-tickets");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reserve ticket");
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    const next = !event.isLiked;
    const prev = event;
    setEvent((c) => ({ ...c, isLiked: next, likeCount: Math.max(0, Number(c.likeCount||0)+(next?1:-1)) }));
    try { const { data } = await API.post(`/events/${event._id}/like`); setEvent(data); }
    catch { setEvent(prev); }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-geist">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-5">
          <div className="h-9 w-32 rounded-xl bg-gray-200" />
          <div className="grid lg:grid-cols-2 gap-6 bg-white rounded-2xl border border-gray-200 p-6">
            <div className="rounded-2xl bg-gray-200 min-h-[360px]" />
            <div className="space-y-4">
              <div className="flex gap-2">{[1,2,3].map(i=><div key={i} className="h-6 w-20 rounded-full bg-gray-200" />)}</div>
              <div className="h-10 w-3/4 bg-gray-200 rounded-xl" />
              <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-4 bg-gray-200 rounded" />)}</div>
              <div className="h-16 bg-gray-200 rounded-xl" />
              <div className="h-12 bg-gray-200 rounded-2xl" />
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 h-64 bg-white rounded-2xl border border-gray-200" />
            <div className="h-64 bg-white rounded-2xl border border-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[65vh] grid place-items-center font-geist">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
            <Info size={24} className="text-gray-400" />
          </div>
          <p className="font-bold text-gray-700">Event not found</p>
          <Link to="/events">
            <Button>Back to events</Button>
          </Link>
        </div>
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

  const isEventLive      = displayStatus === "Live";
  const isEventUpcoming  = displayStatus === "Upcoming";
  const isEventEnded     = displayStatus === "Ended";
  const isEventCancelled = displayStatus === "Cancelled";
  const isEventSuspended = displayStatus === "Suspended";
  const isEventDraft =
    (event.eventLifecycleStatus === "Draft" || event.eventLifecycleStatus === "Pending Approval") &&
    event.status !== "approved";

  const buyDisabled = isSoldOut || freeTicketClaimed || isEventEnded || isEventCancelled || isEventSuspended || isEventDraft;

  const buyLabel = isEventEnded ? "Event ended"
    : isEventCancelled ? "Event cancelled"
    : isEventSuspended ? "Unavailable"
    : isEventDraft ? "Not available"
    : isSoldOut ? "Sold out"
    : freeTicketClaimed ? "Already reserved"
    : isEventUpcoming ? "Reserve tickets"
    : "Get tickets";

  const soldPct = Math.min(100, (((event.ticketsSold||0)) / (((event.ticketsSold||0) + remainingTickets) || 1)) * 100);

  return (
    <>
      <div className="min-h-screen bg-gray-50 font-geist">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-8 space-y-5">

          {/* ── Breadcrumb / actions bar ── */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={() => navigate("/events")}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 transition-all hover:border-pink-300 hover:text-pink-600 shadow-sm"
            >
              <ArrowLeft size={14} /> Back to events
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              {showAnalyticsAction && (
                <Link to={`/events/${event._id}/analytics`}>
                  <button className="inline-flex h-9 items-center gap-1.5 px-3.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 transition-all hover:border-pink-300 hover:text-pink-600 shadow-sm">
                    Analytics
                  </button>
                </Link>
              )}
              {showTicketAction && (
                <Link to={`/events/${event._id}/tickets`}>
                  <button className="inline-flex h-9 items-center gap-1.5 px-3.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 transition-all hover:border-pink-300 hover:text-pink-600 shadow-sm">
                    Manage tickets
                  </button>
                </Link>
              )}
              {showCheckInAction && (
                <Link to={`/events/${event._id}/tickets`}>
                  <button className="inline-flex h-9 items-center gap-1.5 px-3.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 transition-all hover:border-pink-300 hover:text-pink-600 shadow-sm">
                    Check-in
                  </button>
                </Link>
              )}
              {showLiveAction && (
                <Link to={`/live/${event._id}`}>
                  <button className="inline-flex h-9 items-center gap-1.5 px-3.5 rounded-xl bg-red-500 text-white text-xs font-bold shadow-md shadow-red-500/20 transition-all hover:bg-red-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    {event.liveStream?.isLive ? "Live controls" : "Livestream"}
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* ── Hero panel ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">

              {/* Image */}
              <div className="relative overflow-hidden bg-gray-900 min-h-[300px] lg:min-h-[420px]">
                {imageUrl ? (
                  <img src={imageUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <CalendarDays size={52} className="text-white/10" />
                  </div>
                )}
                {/* Status overlay */}
                <div className="absolute top-4 left-4">
                  <StatusPill status={displayStatus} />
                </div>
                {/* Live LIVE badge */}
                {isEventLive && event.liveStream?.isLive && (
                  <div className="absolute bottom-4 left-4">
                    <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-red-500 text-white text-[0.6rem] font-black uppercase tracking-wider shadow-lg">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                      Streaming live
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 lg:p-8 flex flex-col gap-5">

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {event.category && (
                    <span className="inline-flex h-6 px-2.5 items-center rounded-full bg-pink-50 text-pink-600 text-[0.6rem] font-bold border border-pink-200">
                      {event.category}
                    </span>
                  )}
                  <span className="inline-flex h-6 px-2.5 items-center rounded-full bg-gray-100 text-gray-600 text-[0.6rem] font-bold">
                    {event.eventType || "In-person"}
                  </span>
                  {event.visibility === "private" && (
                    <span className="inline-flex h-6 px-2.5 items-center gap-1 rounded-full bg-gray-100 text-gray-600 text-[0.6rem] font-bold">
                      <ShieldCheck size={11} /> Private
                    </span>
                  )}
                  {event.liveStream?.streamType && event.liveStream.streamType !== "Camera" && (
                    <span className="inline-flex h-6 px-2.5 items-center gap-1 rounded-full bg-green-50 text-green-700 text-[0.6rem] font-bold border border-green-200">
                      <MonitorPlay size={11} /> Stream ready
                    </span>
                  )}
                </div>

                {/* Status banners */}
                {(isEventEnded || isEventCancelled || isEventSuspended) && (
                  <div className={`flex items-start gap-2.5 rounded-xl p-3.5 text-sm font-semibold ${
                    isEventEnded ? "bg-gray-100 text-gray-700"
                    : isEventCancelled ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    <Info size={16} className="flex-shrink-0 mt-0.5" />
                    {isEventEnded && "This event has ended."}
                    {isEventCancelled && `This event has been cancelled.${event.cancellationReason ? ` ${event.cancellationReason}` : ""}`}
                    {isEventSuspended && `Temporarily unavailable.${event.suspensionReason ? ` ${event.suspensionReason}` : ""}`}
                  </div>
                )}

                {isEventUpcoming && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-sm text-blue-700">
                    <CalendarDays size={16} className="flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Tickets on sale.</strong> Event starts{" "}
                      {event.startDate
                        ? new Date(event.startDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
                        : "soon"}
                      {event.startTime ? ` at ${event.startTime}` : ""}
                    </span>
                  </div>
                )}

                {/* Title + description */}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 leading-tight mb-2">
                    {event.title}
                  </h1>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{event.description}</p>
                </div>

                {/* Organizer */}
                <button
                  onClick={() => toProfile(event.createdBy)}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50 text-left transition-all hover:border-pink-200 hover:bg-pink-50/30 w-full"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-200">
                    <UserAvatar user={event.createdBy} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                      {event.createdBy?.name || event.createdBy?.username || "Organizer"}
                      <VerifiedBadge user={event.createdBy} />
                    </p>
                    <p className="text-[0.65rem] text-gray-400">@{event.createdBy?.username || "tickispot"}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                </button>

                {/* Engagement */}
                <EventEngagementBar
                  event={event}
                  onLike={handleLike}
                  onComment={() => setCommentsOpen(true)}
                  onShare={() => setShareOpen(true)}
                />
              </div>
            </div>
          </div>

          {/* ── Body layout: 2-col ── */}
          <div className="grid lg:grid-cols-3 gap-5">

            {/* Main content */}
            <div className="lg:col-span-2 space-y-5">

              {/* Schedule card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 lg:p-6">
                <SectionLabel icon={CalendarDays}>Schedule & details</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoChip icon={CalendarDays} label="Date" value={formatEventDateRange(event.startDate, event.endDate)} />
                  <InfoChip icon={Clock3} label="Time" value={formatEventTimeRange(event.startTime, event.endTime)} />
                  <InfoChip icon={MapPin} label="Location" value={event.location || "Online event"} />
                  <InfoChip icon={Users} label="Attending" value={`${event.ticketsSold || 0} people registered`} />
                </div>
              </div>

              {/* About card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 lg:p-6">
                <SectionLabel icon={MessageSquare}>What to expect</SectionLabel>
                <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
                {event.requirements && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3.5">
                    <Info size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">{event.requirements}</p>
                  </div>
                )}
              </div>

              {/* Team */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 lg:p-6">
                <SectionLabel icon={Users}>Event team</SectionLabel>
                {teamLoading ? (
                  <div className="space-y-2">
                    {[1,2].map(i => <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />)}
                  </div>
                ) : teamError ? (
                  <p className="text-sm text-red-500">{teamError}</p>
                ) : teamMembers.length ? (
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50/20 transition-colors">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                          <UserAvatar user={member.user} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">{member.user?.name || member.user?.username || "Team Member"}</p>
                          <p className="text-xs text-gray-400">{member.user?.email}</p>
                        </div>
                        <span className="text-[0.6rem] font-black uppercase tracking-wider text-pink-500 bg-pink-50 px-2 py-1 rounded-full">
                          {member.role.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No team members added yet.</p>
                )}
              </div>

              {/* Reviews */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 lg:p-6">
                <SectionLabel icon={Star}>Reviews</SectionLabel>
                {ratingStats && <RatingStats stats={ratingStats} compact={false} />}

                {user && String(user._id) !== String(event.createdBy?._id) && (
                  <div className="mt-4">
                    {!showReviewForm ? (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="w-full h-10 rounded-xl bg-pink-500 text-white text-sm font-bold transition-all hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/20"
                      >
                        Write a review
                      </button>
                    ) : (
                      <div className="rounded-xl border border-gray-200 p-4 mb-4">
                        <ReviewForm
                          targetType="event"
                          targetId={event._id}
                          eventId={event._id}
                          onSubmitSuccess={() => {
                            loadEventRatings(event._id).then(setRatingStats);
                            loadEventReviews(event._id, 5).then((r) => setReviews(r.reviews));
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
                    <div className="space-y-2">
                      {[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
                    </div>
                  ) : reviews.length ? (
                    reviews.map((review) => <ReviewCard key={review._id} review={review} />)
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-6">
                      No reviews yet. Be the first to share your experience!
                    </p>
                  )}
                </div>
              </div>

              {/* Live stream */}
              {event.liveStream?.isLive && streamEmbedUrl && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 lg:p-6">
                  <SectionLabel icon={MonitorPlay}>Live stream</SectionLabel>
                  {canAccessLiveStreaming ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900">
                      <iframe
                        src={streamEmbedUrl}
                        title="Live Stream"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                      <div className="relative z-10 text-center text-white p-6 max-w-xs">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                          <Lock size={24} className="text-white/80" />
                        </div>
                        <h3 className="font-black text-lg mb-2">Pro feature</h3>
                        <p className="text-sm text-white/70 mb-4">Upgrade to Pro to watch live streams.</p>
                        <button
                          onClick={promptUpgradeLive}
                          className="inline-flex h-9 items-center px-5 rounded-xl bg-pink-500 text-white text-xs font-bold shadow-lg hover:bg-pink-600 transition-all"
                        >
                          Upgrade now
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="h-fit lg:sticky lg:top-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 lg:p-6 space-y-5">

                <div>
                  <p className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                    Tickets from
                  </p>
                  <p className="text-3xl font-black tracking-tight text-gray-900">{ticketStartingPrice}</p>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-[0.6rem] font-bold text-gray-400 mb-1.5">
                    <span>{event.ticketsSold || 0} sold</span>
                    <span>{remainingTickets} remaining</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-pink-500 transition-all duration-700"
                      style={{ width: `${soldPct}%` }}
                    />
                  </div>
                  {soldPct >= 80 && (
                    <p className="text-[0.6rem] font-bold text-amber-600 mt-1.5 flex items-center gap-1">
                      <Zap size={10} /> Selling fast — {Math.round(100 - soldPct)}% left
                    </p>
                  )}
                </div>

                {/* Ticket tier cards */}
                <div className="space-y-3">
                  {visiblePricing.length ? (
                    visiblePricing.map((t) => (
                      <TicketTypeButton
                        key={t._id || t.type}
                        ticketType={t}
                        event={event}
                        isSelected={selectedTicketType?.type === t.type}
                        isEventFree={isEventFree}
                        quantity={quantity}
                        buyDisabled={buyDisabled}
                        onSelect={() => setSelectedTicketType(t)}
                        onQuantityChange={setQuantity}
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40">
                      <div>
                        <p className="text-sm font-black text-gray-900">Free admission</p>
                        <p className="text-xs text-gray-500 mt-0.5">Reserve your spot instantly</p>
                      </div>
                      <span className="text-sm font-black text-emerald-600">Free</span>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <button
                  type="button"
                  onClick={handleBuy}
                  disabled={buyDisabled}
                  className={`w-full h-12 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                    buyDisabled
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-pink-500 text-white shadow-lg shadow-pink-500/30 hover:bg-pink-600 hover:-translate-y-0.5"
                  }`}
                >
                  <Ticket size={16} />
                  {buyLabel}
                </button>

                {/* Trust */}
                <div className="flex items-center justify-center gap-4 flex-wrap pt-1">
                  <span className="inline-flex items-center gap-1.5 text-[0.65rem] text-gray-400">
                    <ShieldCheck size={13} className="text-emerald-500" /> Secure checkout
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[0.65rem] text-gray-400">
                    <ExternalLink size={13} className="text-emerald-500" /> Instant confirmation
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Mobile sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-sm p-3 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[0.55rem] font-black uppercase tracking-wider text-gray-400">
              {selectedTicketType ? getTierDisplayName(selectedTicketType) : "Tickets"}
            </p>
            <p className="text-lg font-black text-gray-900 truncate">
              {selectedTicketType
                ? (isEventFree || selectedTicketType.isFree ? "Free" : formatCurrency(selectedTicketType.price))
                : ticketStartingPrice}
            </p>
          </div>
          <button
            type="button"
            onClick={handleBuy}
            disabled={buyDisabled}
            className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-black transition-all ${
              buyDisabled ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-pink-500 text-white shadow-lg shadow-pink-500/25 hover:bg-pink-600"
            }`}
          >
            <Ticket size={16} />
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
          else setEvent((c) => ({ ...c, commentCount: nextCount }));
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

export { getTierDisplayName };