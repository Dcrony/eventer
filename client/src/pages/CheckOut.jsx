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
import "./CSS/checkout.css";

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
      <div className="checkout-page checkout-page--error">
        <div className="checkout-error-container">
          <div className="checkout-error-icon-wrap">
            <AlertCircle size={40} strokeWidth={1.5} />
          </div>
          <h2>Couldn&apos;t load checkout</h2>
          <p>Go back to the event and select tickets again.</p>
          <button
            type="button"
            onClick={() => navigate("/events")}
            className="error-btn"
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
        amount: lineTotal,
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
    : "Review your tickets and pay securely. You’ll get a confirmation by email.";
  const ctaCopy = isFreeEvent
    ? "Reserve Free Ticket"
    : `Pay ₦${lineTotal.toLocaleString()}`;

  return (
    <div className="dashboard-page checkout-page">
      <div className="checkout-bg-pattern" aria-hidden="true" />

      <div className="checkout-shell">
        <nav className="checkout-top-bar">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="checkout-back-nav"
          >
            <ArrowLeft size={18} strokeWidth={2} />
            <span>Back</span>
          </button>
          <div className="checkout-top-trust">
            <ShieldCheck size={16} />
            <span>{topTrustCopy}</span>
          </div>
        </nav>

        <header className="checkout-hero">
          <div className="checkout-hero-badge">
            <Sparkles size={14} />
            Checkout
          </div>
          <h1 className="checkout-hero-title">Complete your order</h1>
          <p className="checkout-hero-sub">{heroCopy}</p>
        </header>

        <div className="checkout-layout">
          <div className="checkout-main-col">
            <article className="checkout-card checkout-card--event">
              <div className="event-summary-card event-summary-card--checkout">
                <div className="event-image-placeholder">
                  {eventImg ? (
                    <img
                      src={eventImg}
                      alt=""
                      className="event-image"
                    />
                  ) : (
                    <Calendar size={36} strokeWidth={1.5} />
                  )}
                </div>
                <div className="event-summary-details">
                  <h2>{event.title}</h2>
                  <div className="event-meta">
                    {event.category && (
                      <span className="checkout-pill">{event.category}</span>
                    )}
                    <span className="checkout-pill checkout-pill--muted">
                      {event.eventType || "In person"}
                    </span>
                  </div>
                  <div className="event-meta event-meta--icons">
                    <span className="meta-item">
                      <Calendar size={15} />
                      {formatDate(event.startDate)}
                    </span>
                    <span className="meta-item">
                      <Clock size={15} />
                      {event.startTime}
                    </span>
                    <span className="meta-item">
                      <MapPin size={15} />
                      {event.location || "Online"}
                    </span>
                    <span className="meta-item">
                      <Users size={15} />
                      {event.ticketsSold ?? 0} attending
                    </span>
                  </div>
                </div>
              </div>

              {event.pricing && event.pricing.length > 1 && (
                <section className="checkout-section checkout-section--flush">
                  <div className="section-header">
                    <Ticket className="section-icon" size={20} />
                    <h3>Ticket type</h3>
                  </div>
                  <div className="ticket-types-grid">
                    {event.pricing.map((p) => {
                      const active = selectedPricing?.type === p.type;
                      return (
                        <button
                          key={p.type}
                          type="button"
                          className={`ticket-type-card ${active ? "selected" : ""}`}
                          onClick={() => setSelectedPricing(p)}
                        >
                          <div className="ticket-type-header">
                            <span className="ticket-type-name">{p.type}</span>
                            {active && (
                              <CheckCircle className="selected-icon" size={18} />
                            )}
                          </div>
                          <div className="ticket-type-price">
                            ₦{Number(p.price).toLocaleString()}
                          </div>
                          {p.benefits && (
                            <p className="ticket-type-benefits">{p.benefits}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="checkout-section">
                <div className="section-header">
                  <Users className="section-icon" size={20} />
                  <h3>Buyer</h3>
                </div>
                <div className="buyer-info-card">
                  <div className="buyer-info-row">
                    <UserAvatar user={user} className="buyer-avatar" />
                    <div>
                      <div className="buyer-name">{user.username}</div>
                      <div className="buyer-email">{user.email}</div>
                    </div>
                  </div>
                </div>
              </section>

              {event.description && (
                <section className="checkout-section checkout-section--muted">
                  <h4 className="checkout-about-title">About this event</h4>
                  <p className="checkout-about-text">{event.description}</p>
                </section>
              )}
            </article>
          </div>

          <aside className="checkout-aside-col">
            <div className="checkout-card checkout-card--sticky">
              <div className="checkout-aside-header">
                <span className="checkout-aside-label">Order summary</span>
                <span className="checkout-aside-total">
                  ₦{lineTotal.toLocaleString()}
                </span>
              </div>

              <div className="order-summary">
                <div className="summary-row">
                  <span>Type</span>
                  <span className="summary-value">
                    {selectedPricing?.type || ticketType}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Unit price</span>
                  <span className="summary-value">
                    ₦{unitPrice.toLocaleString()}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Quantity</span>
                  <span className="summary-value">{quantity}</span>
                </div>
                <div className="summary-divider" />
                <div className="summary-row total">
                  <span>Total</span>
                  <span className="total-value">₦{lineTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="checkout-actions">
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="checkout-pay-btn"
                >
                  {loading ? (
                    <>
                      <span className="spinner-small" aria-hidden />
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

              <div className="trust-badges">
                <div className="trust-badge">
                  <ShieldCheck size={16} />
                  {isFreeEvent ? "Instant confirmation" : "Encrypted checkout"}
                </div>
                <div className="trust-badge">
                  <Ticket size={16} />
                  E-tickets by email
                </div>
              </div>
            </div>

            <div className="checkout-notice">
              <AlertCircle size={16} className="checkout-notice-icon" />
              <p>
                Refunds may be available up to 24 hours before the event, per organizer
                policy.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
