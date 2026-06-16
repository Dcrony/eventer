import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { getEventImageUrl } from "../utils/eventHelpers";
import { UserAvatar } from "../components/ui/avatar";
import { useToast } from "../components/ui/toast";
import useReferralTracking from "../utils/useReferralTracking";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  ShieldCheck,
  ArrowLeft,
  Lock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Tag,
  Zap,
  Info,
} from "lucide-react";

/* ─── Tier helpers ───────────────────────────────────────────────────────── */
const getTierDisplayName = (tier) => tier?.label?.trim() || tier?.type || "Ticket";
const getTierAccentColor = (tier) => tier?.color?.trim() || "#ec4899";
const isTierFree = (tier, isEventFree) =>
  isEventFree || Boolean(tier?.isFree) || Number(tier?.price || 0) === 0;

/* ─── Small reusable bits ────────────────────────────────────────────────── */
function SectionTitle({ children }) {
  return (
    <h3 className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400 mb-3">
      {children}
    </h3>
  );
}

function OrderRow({ label, value, bold, large, accent }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className={`text-sm ${bold ? "font-bold text-gray-900" : "text-gray-500"}`}>
        {label}
      </span>
      <span
        className={`tabular-nums ${
          large
            ? "text-2xl font-black tracking-tight text-pink-500"
            : bold
            ? "font-bold text-gray-900"
            : "text-sm text-gray-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const { event, quantity, user, ticketType, price } = state || {};
  const isFreeEvent = event?.isFreeEvent || event?.isFree;

  const { referrerId, recordConversion } = useReferralTracking(event?._id);

  const visiblePricing = useMemo(
    () =>
      (event?.pricing || []).filter(
        (p) => p.isEnabled !== false && !p.isFree && Number(p.price || 0) > 0
      ),
    [event]
  );

  const [selectedPricing, setSelectedPricing] = useState(
    () =>
      visiblePricing.find((p) => p.type === ticketType) ||
      visiblePricing[0] ||
      null
  );

  /* ── Skip checkout for free tiers ── */
  useEffect(() => {
    const tierIsFree = isTierFree(selectedPricing, isFreeEvent);
    if (!event || !tierIsFree) return;
    API.post("/tickets/create", {
      eventId: event._id,
      quantity: 1,
      ticketType: selectedPricing?.type || "Free",
      isFree: true,
    })
      .then(() => { toast.success("Ticket reserved!"); navigate("/my-tickets"); })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to reserve ticket");
        navigate(`/event/${event._id}`);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const unitPrice = useMemo(() => selectedPricing?.price ?? price ?? 0, [selectedPricing, price]);
  const platformFeePercent = Number(event?.platformFeePercent ?? 0) || 0;
  const feeAmount = useMemo(
    () => Math.round((unitPrice * (quantity || 0) * platformFeePercent) / 100),
    [unitPrice, quantity, platformFeePercent]
  );
  const lineTotal = useMemo(() => unitPrice * (quantity || 0), [unitPrice, quantity]);
  const grandTotal = useMemo(() => lineTotal + feeAmount, [lineTotal, feeAmount]);

  /* ── Guard ── */
  if (!event || !quantity || !user || !ticketType || price == null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 font-geist">
        <div className="text-center max-w-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Checkout unavailable</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Go back to the event and select your tickets again.
            </p>
          </div>
          <button
            onClick={() => navigate("/events")}
            className="inline-flex h-11 items-center gap-2 px-6 rounded-2xl bg-pink-500 text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:bg-pink-600 transition-all hover:-translate-y-0.5"
          >
            Browse events
          </button>
        </div>
      </div>
    );
  }

  /* ── Payment ── */
  const handleConfirmPayment = async () => {
    if (!event || !quantity || !user || !ticketType || price == null) {
      toast.error("Invalid checkout data.");
      navigate("/events");
      return;
    }
    const tierIsFree = isTierFree(selectedPricing, isFreeEvent);
    setLoading(true);
    try {
      if (tierIsFree) {
        await API.post("/tickets/create", {
          eventId: event._id, quantity: 1,
          ticketType: selectedPricing?.type || "Free", isFree: true,
        });
        recordConversion({ ticketCount: 1, revenue: 0 });
        toast.success("Ticket reserved!");
        navigate("/my-tickets");
        return;
      }
      const res = await API.post("/payment/initiate", {
        email: user.email,
        metadata: {
          eventId: event._id,
          userId: user._id,
          quantity: quantity.toString(),
          price: unitPrice.toString(),
          pricingType: selectedPricing?.type || ticketType,
          referrerId: referrerId || "",
        },
      });
      if (res.data?.url) window.location.href = res.data.url;
      else toast.error("Failed to initiate payment");
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });

  const eventImg = getEventImageUrl(event);
  const tierIsFree = isTierFree(selectedPricing, isFreeEvent);
  const ctaCopy = tierIsFree ? "Reserve free ticket" : `Pay ₦${grandTotal.toLocaleString()}`;

  /* ── Sold progress ── */
  const soldPct = Math.min(
    100,
    ((event.ticketsSold || 0) / ((event.ticketsSold || 0) + (event.totalTickets || 1))) * 100
  );

  return (
    <div className="min-h-screen bg-gray-50 font-geist">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10">

        {/* ── Nav bar ── */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-sm transition-all hover:border-pink-300 hover:text-pink-600"
          >
            <ArrowLeft size={14} /> Back
          </button>

          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-full bg-pink-500 text-white text-[0.55rem] font-black flex items-center justify-center">1</span>
              <span className="font-semibold text-gray-700">Review</span>
            </span>
            <ChevronRight size={12} className="text-gray-300" />
            <span className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-full bg-gray-200 text-gray-500 text-[0.55rem] font-black flex items-center justify-center">2</span>
              <span>Payment</span>
            </span>
            <ChevronRight size={12} className="text-gray-300" />
            <span className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-full bg-gray-200 text-gray-500 text-[0.55rem] font-black flex items-center justify-center">3</span>
              <span>Confirm</span>
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck size={14} className="text-emerald-500" />
            {tierIsFree ? "Instant reservation" : "Secured by Paystack"}
          </div>
        </div>

        {/* ── Page title ── */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-pink-50 border border-pink-200 text-pink-600 text-[0.6rem] font-black uppercase tracking-wider mb-3">
            <Ticket size={12} /> Checkout
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
            {tierIsFree ? "Reserve your spot" : "Complete your order"}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {tierIsFree
              ? "Confirm your details and reserve your free ticket instantly."
              : "Review your tickets and complete your secure payment."}
          </p>
        </div>

        {/* ── Two-col layout ── */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">

          {/* ── Left column ── */}
          <div className="space-y-4">

            {/* Event summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-start gap-4 p-5 sm:p-6 border-b border-gray-100">
                {/* Thumbnail */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                  {eventImg ? (
                    <img src={eventImg} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar size={24} className="text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {event.category && (
                      <span className="inline-flex h-5 px-2 items-center rounded-full bg-pink-50 text-pink-600 text-[0.55rem] font-bold border border-pink-200">
                        {event.category}
                      </span>
                    )}
                    <span className="inline-flex h-5 px-2 items-center rounded-full bg-gray-100 text-gray-500 text-[0.55rem] font-bold">
                      {event.eventType || "In-person"}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900 mb-3 leading-tight">
                    {event.title}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
                    {[
                      { icon: Calendar, value: formatDate(event.startDate) },
                      { icon: Clock,    value: event.startTime },
                      { icon: MapPin,   value: event.location || "Online" },
                      { icon: Users,    value: `${event.ticketsSold ?? 0} attending` },
                    ].map(({ icon: Icon, value }) => (
                      <div key={value} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Icon size={12} className="text-pink-400 flex-shrink-0" />
                        <span className="truncate">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Sold progress */}
                  {soldPct > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-pink-500 transition-all duration-700"
                          style={{ width: `${soldPct}%` }}
                        />
                      </div>
                      {soldPct >= 75 && (
                        <p className="text-[0.6rem] text-amber-600 font-bold mt-1 flex items-center gap-1">
                          <Zap size={9} /> Selling fast
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div className="px-5 sm:px-6 py-4">
                  <SectionTitle>About this event</SectionTitle>
                  <p className="text-sm text-gray-500 leading-relaxed">{event.description}</p>
                </div>
              )}
            </div>

            {/* Ticket type selection */}
            {visiblePricing.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
                <SectionTitle>Select ticket type</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visiblePricing.map((p) => {
                    const active = selectedPricing?.type === p.type;
                    const name = getTierDisplayName(p);
                    const accent = getTierAccentColor(p);
                    const free = isTierFree(p, isFreeEvent);
                    const priceStr = free ? "Free" : `₦${Number(p.price).toLocaleString()}`;

                    return (
                      <button
                        key={p.type}
                        type="button"
                        onClick={() => setSelectedPricing(p)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          active
                            ? "border-pink-500 bg-pink-50/60 shadow-md shadow-pink-500/10"
                            : "border-gray-200 bg-white hover:border-pink-300 hover:bg-pink-50/20"
                        }`}
                      >
                        {active && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle size={16} className="text-pink-500" />
                          </div>
                        )}

                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: accent }}
                          />
                          <span className="text-sm font-black text-gray-900 truncate pr-5">{name}</span>
                        </div>

                        <div
                          className="text-xl font-black tracking-tight mb-1"
                          style={{ color: active ? accent : "#ec4899" }}
                        >
                          {priceStr}
                        </div>

                        {p.description && (
                          <p className="text-xs text-gray-400 leading-relaxed mt-1">{p.description}</p>
                        )}
                        {p.maxPerOrder > 0 && (
                          <p className="text-[0.58rem] text-gray-400 mt-1.5 flex items-center gap-1">
                            <Tag size={9} /> Max {p.maxPerOrder} per order
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Buyer info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
              <SectionTitle>Ticket buyer</SectionTitle>
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-gray-50">
                <UserAvatar user={user} className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900">{user.username}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <span className="inline-flex h-6 px-2 items-center rounded-full bg-emerald-50 text-emerald-700 text-[0.55rem] font-bold border border-emerald-200">
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* ── Right column: order summary ── */}
          <aside className="lg:sticky lg:top-6 space-y-4">

            {/* Summary card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              {/* Header */}
              <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-gray-900 to-gray-800">
                <p className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400 mb-1">
                  Order total
                </p>
                <p className="text-4xl font-black tracking-tight text-white">
                  {tierIsFree ? "Free" : `₦${grandTotal.toLocaleString()}`}
                </p>
                {!tierIsFree && (
                  <p className="text-[0.65rem] text-gray-500 mt-1">
                    Incl. {platformFeePercent}% platform fee
                  </p>
                )}
              </div>

              {/* Tier + details */}
              <div className="p-5">
                {/* Selected tier */}
                {selectedPricing && (
                  <div className="flex items-center gap-2.5 mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getTierAccentColor(selectedPricing) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-900 truncate">
                        {getTierDisplayName(selectedPricing)}
                      </p>
                      {selectedPricing.description && (
                        <p className="text-[0.6rem] text-gray-400 truncate">{selectedPricing.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Line items */}
                <div className="divide-y divide-gray-50">
                  <OrderRow label="Unit price" value={tierIsFree ? "Free" : `₦${unitPrice.toLocaleString()}`} />
                  <OrderRow label={`Quantity`} value={`× ${quantity}`} />
                  <OrderRow label="Subtotal" value={tierIsFree ? "Free" : `₦${lineTotal.toLocaleString()}`} bold />
                  {!tierIsFree && platformFeePercent > 0 && (
                    <OrderRow label={`Platform fee (${platformFeePercent}%)`} value={`₦${feeAmount.toLocaleString()}`} />
                  )}
                </div>

                <div className="mt-3 pt-3 border-t-2 border-gray-200">
                  <OrderRow
                    label="Total"
                    value={tierIsFree ? "Free" : `₦${grandTotal.toLocaleString()}`}
                    bold
                    large
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="w-full h-13 py-3.5 rounded-2xl bg-pink-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 transition-all hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      {ctaCopy}
                    </>
                  )}
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 flex-wrap px-5 pb-5 pt-1">
                <span className="inline-flex items-center gap-1.5 text-[0.6rem] text-gray-400">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  {tierIsFree ? "Instant confirmation" : "Encrypted payment"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[0.6rem] text-gray-400">
                  <Ticket size={12} className="text-emerald-500" />
                  E-ticket by email
                </span>
              </div>
            </div>

            {/* Refund notice */}
            {!tierIsFree && (
              <div className="flex items-start gap-2.5 p-4 rounded-xl border border-amber-200 bg-amber-50/60">
                <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Refunds may be available up to 24 hours before the event, subject to organizer policy.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ── Mobile sticky footer ── */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-sm p-3 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[0.55rem] font-black uppercase tracking-wider text-gray-400">
              {getTierDisplayName(selectedPricing) || "Ticket"}
            </p>
            <p className="text-lg font-black text-gray-900 truncate">
              {tierIsFree ? "Free reservation" : ctaCopy}
            </p>
          </div>
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={loading}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-pink-500 px-5 text-sm font-black text-white shadow-lg shadow-pink-500/25 transition-all hover:bg-pink-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Lock size={15} />
            )}
            {loading ? "…" : tierIsFree ? "Reserve" : "Pay now"}
          </button>
        </div>
      </div>
    </div>
  );
}