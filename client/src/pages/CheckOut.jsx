import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { getEventImageUrl } from "../utils/eventHelpers";
import { UserAvatar } from "../components/ui/avatar";
import { useToast } from "../components/ui/toast";
import { useMemo, useState } from "react";
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
} from "lucide-react";

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const { event, quantity, user, ticketType, price } = state || {};
  const isFreeEvent = event?.isFreeEvent || event?.isFree;

  const [selectedPricing, setSelectedPricing] = useState(
    event?.pricing?.find((p) => p.type === ticketType) || null
  );

  const unitPrice = useMemo(() => {
    return selectedPricing?.price ?? price ?? 0;
  }, [selectedPricing, price]);

  const lineTotal = useMemo(() => unitPrice * (quantity || 0), [unitPrice, quantity]);

  if (!event || !quantity || !user || !ticketType || price == null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 pb-24 font-geist">
        <div className="flex flex-col items-center justify-center gap-5 p-12 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-50 grid place-items-center text-red-500">
            <AlertCircle size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 m-0">Couldn&apos;t load checkout</h2>
          <p className="text-sm text-gray-400 m-0">Go back to the event and select tickets again.</p>
          <button
            type="button"
            onClick={() => navigate("/events")}
            className="h-11 px-7 bg-pink-500 text-white rounded-full font-bold text-sm transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/20"
          >
            Browse events
          </button>
        </div>
      </div>
    );
  }

  const handleConfirmPayment = async () => {
    if (!event || !quantity || !user || !ticketType || price == null) {
      toast.error("Invalid checkout data. Please try again.");
      navigate("/events");
      return;
    }

    setLoading(true);
    try {
      if (isFreeEvent) {
        await API.post("/tickets/create", {
          eventId: event._id,
          quantity,
          ticketType: selectedPricing?.type || ticketType || "Free",
          isFree: true,
        });
        toast.success("Ticket reserved successfully");
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
        },
      });

      const { url } = res.data;
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Failed to initiate payment");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const eventImg = getEventImageUrl(event);
  const topTrustCopy = isFreeEvent
    ? "Instant ticket reservation"
    : "Secure payment via Paystack";
  const heroCopy = isFreeEvent
    ? "Review your ticket details and reserve your spot instantly."
    : "Review your tickets and pay securely. You'll get a confirmation by email.";
  const ctaCopy = isFreeEvent
    ? "Reserve Free Ticket"
    : `Pay ₦${lineTotal.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-gray-50 font-geist relative overflow-x-hidden">
      {/* Subtle pink radial background */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_15%_25%,rgba(244,63,142,0.05)_0%,transparent_50%),radial-gradient(circle_at_85%_75%,rgba(244,63,142,0.04)_0%,transparent_50%)]" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-5 lg:px-6 py-5 pb-16 sm:pb-20">
        {/* Top Bar */}
        <nav className="flex items-center justify-between gap-4 flex-wrap mb-7">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-semibold transition-all duration-200 hover:border-pink-500 hover:text-pink-500 hover:bg-pink-50 hover:-translate-x-0.5 shadow-sm"
          >
            <ArrowLeft size={18} strokeWidth={2} />
            <span>Back</span>
          </button>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
            <ShieldCheck size={16} className="text-green-500" />
            <span>{topTrustCopy}</span>
          </div>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-pink-50 border border-pink-200 text-pink-500 text-[0.65rem] font-bold uppercase tracking-wider mb-3">
            <Sparkles size={14} /> Checkout
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-gray-900 mb-2">
            Complete your order
          </h1>
          <p className="max-w-2xl text-sm text-gray-400 leading-relaxed">
            {heroCopy}
          </p>
        </header>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* Main Column */}
          <div className="min-w-0">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in-up">
              {/* Event Summary */}
              <div className="checkout-event-summary relative overflow-hidden p-5 sm:p-6 bg-gradient-to-br from-pink-50/60 via-transparent to-transparent border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-20 h-20 rounded-xl bg-pink-100 border border-pink-200 flex items-center justify-center text-pink-500 overflow-hidden flex-shrink-0">
                    {eventImg ? (
                      <img src={eventImg} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Calendar size={36} strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-extrabold tracking-tight text-gray-900 mb-2">
                      {event.title}
                    </h2>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {event.category && (
                        <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[0.65rem] font-bold bg-pink-50 text-pink-500 border border-pink-200">
                          {event.category}
                        </span>
                      )}
                      <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[0.65rem] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                        {event.eventType || "In person"}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={14} className="text-pink-500 flex-shrink-0" />
                        <span>{formatDate(event.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={14} className="text-pink-500 flex-shrink-0" />
                        <span>{event.startTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin size={14} className="text-pink-500 flex-shrink-0" />
                        <span>{event.location || "Online"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users size={14} className="text-pink-500 flex-shrink-0" />
                        <span>{event.ticketsSold ?? 0} attending</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Type Selection */}
              {event.pricing && event.pricing.length > 1 && (
                <section className="p-5 sm:p-6 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Ticket size={20} className="text-pink-500" />
                    <h3 className="text-sm font-bold text-gray-900 m-0">Ticket type</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {event.pricing.map((p) => {
                      const active = selectedPricing?.type === p.type;
                      return (
                        <button
                          key={p.type}
                          type="button"
                          onClick={() => setSelectedPricing(p)}
                          className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                            active
                              ? "border-pink-500 bg-pink-50 shadow-md scale-[1.02]"
                              : "border-gray-200 bg-gray-50 hover:border-pink-200 hover:bg-pink-50/30 hover:-translate-y-0.5"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-sm text-gray-900">{p.type}</span>
                            {active && <CheckCircle size={18} className="text-pink-500" />}
                          </div>
                          <div className="text-xl font-extrabold text-pink-500 tracking-tight mb-1">
                            ₦{Number(p.price).toLocaleString()}
                          </div>
                          {p.benefits && (
                            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{p.benefits}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Buyer Info */}
              <section className="p-5 sm:p-6 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={20} className="text-pink-500" />
                  <h3 className="text-sm font-bold text-gray-900 m-0">Buyer</h3>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} className="w-10 h-10 rounded-lg flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-gray-900">{user.username}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{user.email}</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* About Event */}
              {event.description && (
                <section className="p-5 sm:p-6 bg-gray-50/50">
                  <h4 className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    About this event
                  </h4>
                  <p className="text-sm text-gray-500 leading-relaxed m-0">
                    {event.description}
                  </p>
                </section>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-5 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Order Summary Header */}
              <div className="flex items-baseline justify-between gap-4 p-5 pb-4 bg-gradient-to-br from-pink-50/40 via-transparent to-transparent border-b border-gray-200">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">
                  Order summary
                </span>
                <span className="text-2xl font-extrabold text-pink-500 tracking-tight">
                  ₦{lineTotal.toLocaleString()}
                </span>
              </div>

              {/* Order Details */}
              <div className="p-5">
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Type</span>
                    <span className="font-semibold text-gray-900">{selectedPricing?.type || ticketType}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Unit price</span>
                    <span className="font-semibold text-gray-900">₦{unitPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Quantity</span>
                    <span className="font-semibold text-gray-900">{quantity}</span>
                  </div>
                  <div className="h-px bg-gray-200 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-extrabold text-pink-500 tracking-tight">
                      ₦{lineTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <div className="px-5 pb-4">
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-full bg-pink-500 text-white font-bold text-sm transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/30"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock size={20} strokeWidth={2} />
                      {ctaCopy}
                    </>
                  )}
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex justify-center gap-4 flex-wrap p-4 pt-2 border-t border-gray-200">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                  <ShieldCheck size={14} className="text-green-500" />
                  {isFreeEvent ? "Instant confirmation" : "Encrypted checkout"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                  <Ticket size={14} className="text-green-500" />
                  E-tickets by email
                </span>
              </div>
            </div>

            {/* Refund Notice */}
            <div className="flex gap-2 p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-gray-500 leading-relaxed">
              <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="m-0">
                Refunds may be available up to 24 hours before the event, per organizer policy.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}