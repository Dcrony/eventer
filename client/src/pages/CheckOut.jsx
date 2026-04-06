import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { PORT_URL } from "../utils/config";
import { useState, useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContexts";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Ticket,
  CreditCard,
  Shield,
  ArrowLeft,
  Lock,
  CheckCircle,
  AlertCircle,
  Users,
  ShieldCheck,
  ExternalLink
} from "lucide-react";
import "../pages/CSS/eventdetail.css";

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { darkMode } = useContext(ThemeContext);

  const { event, quantity, user, ticketType, price } = state || {};

  // Check if all necessary data exists
  if (!event || !quantity || !user || !ticketType || !price) {
    return (
      <div className="checkout-error-container">
        <AlertCircle size={48} className="error-icon" />
        <h2>Invalid Checkout Details</h2>
        <p>Something went wrong. Please try again.</p>
        <button onClick={() => navigate("/events")} className="error-btn">
          Browse Events
        </button>
      </div>
    );
  }

  const totalAmount = price * quantity;

  // State for selected pricing option
  const [selectedPricing, setSelectedPricing] = useState(
    event.pricing?.find((p) => p.type === ticketType) || null
  );

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      const res = await API.post("/payment/initiate", {
        email: user.email,
        amount: totalAmount,
        metadata: {
          eventId: event._id,
          userId: user._id,
          quantity: quantity.toString(),
          price: (selectedPricing?.price || price).toString(),
          pricingType: selectedPricing?.type || ticketType,
        },
      });

      const { url } = res.data;
      if (url) {
        window.location.href = url;
      } else {
        alert("Failed to initiate payment");
      }
    } catch (err) {
      console.error(err);
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className={`event-hub ${darkMode ? "dark-mode" : ""}`}>
      {/* Glassy Background Blur */}
      <div className="hub-bg-blur">
        {event.image && (
          <img
            src={`${PORT_URL.replace("/api", "")}/uploads/event_image/${event.image}`}
            alt={event.title}
          />
        )}
      </div>

      <div className="hub-container">
        {/* Top Navigation Bar */}
        <header className="hub-header">
          <button onClick={() => navigate(-1)} className="hub-back-btn">
            <ArrowLeft size={18} />
            <span>Back to Event</span>
          </button>
          <div className="hub-header-actions">
            <button className="hub-circle-btn" title="Share">
              <Shield size={18} />
            </button>
          </div>
        </header>

        {/* Main Hub Layout */}
        <div className="hub-main">
          {/* Left Column: Content */}
          <section className="hub-content">
            <div className="hub-image-wrapper">
              {event.image ? (
                <img
                  src={`${PORT_URL.replace("/api", "")}/uploads/event_image/${event.image}`}
                  alt={event.title}
                  className="hub-main-img"
                />
              ) : (
                <div className="hub-img-placeholder">
                  <Calendar size={80} />
                </div>
              )}
            </div>

            <div className="hub-title-section">
              <div className="hub-category-row">
                {event.category && <span className="hub-badge">{event.category}</span>}
                <span className="hub-badge outline">{event.eventType || "In-Person"}</span>
              </div>
              <h1 className="hub-title">Complete Your Purchase</h1>
              <p className="hub-description">You're just one step away from securing your tickets for this amazing event</p>
            </div>

            <div className="hub-about">
              <h3 className="hub-section-label">Event Details</h3>
              <p className="hub-description">{event.description}</p>
            </div>

            <div className="hub-details-grid">
              <div className="hub-detail-item">
                <div className="hub-detail-icon">
                  <Calendar />
                </div>
                <div className="hub-detail-info">
                  <label>Date</label>
                  <span>{formatDate(event.startDate)}</span>
                </div>
              </div>
              <div className="hub-detail-item">
                <div className="hub-detail-icon">
                  <Clock />
                </div>
                <div className="hub-detail-info">
                  <label>Time</label>
                  <span>{event.startTime}</span>
                </div>
              </div>
              <div className="hub-detail-item">
                <div className="hub-detail-icon">
                  <MapPin />
                </div>
                <div className="hub-detail-info">
                  <label>Location</label>
                  <span>{event.location || "Online Event"}</span>
                </div>
              </div>
              <div className="hub-detail-item">
                <div className="hub-detail-icon">
                  <Users />
                </div>
                <div className="hub-detail-info">
                  <label>Attendees</label>
                  <span>{event.ticketsSold || 0} people attending</span>
                </div>
              </div>
            </div>

            {/* Ticket Type Selection */}
            {event.pricing && event.pricing.length > 1 && (
              <div className="hub-ticket-types">
                <label className="hub-label">Select Your Ticket Type</label>
                {event.pricing.map((pricing, index) => (
                  <div
                    key={pricing.type}
                    className={`ticket-type-card ${
                      selectedPricing?.type === pricing.type ? "active" : ""
                    }`}
                    onClick={() => setSelectedPricing(pricing)}
                  >
                    <div className="ticket-type-left">
                      <div className="ticket-type-radio">
                        {selectedPricing?.type === pricing.type && (
                          <CheckCircle size={16} />
                        )}
                      </div>
                      <div className="ticket-type-info">
                        <span className="ticket-type-name">{pricing.type}</span>
                        {pricing.benefits && (
                          <span className="ticket-type-benefits">{pricing.benefits}</span>
                        )}
                      </div>
                    </div>
                    <div className="ticket-type-price">
                      <span className="price">₦{pricing.price.toLocaleString()}</span>
                      <span className="price-per">/ ticket</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Buyer Information */}
            <div className="hub-organizer">
              <h3 className="hub-section-label">Buyer Information</h3>
              <div className="hub-organizer-card">
                <div className="hub-org-avatar-fallback">
                  {user.username?.charAt(0) || "U"}
                </div>
                <div className="hub-org-text">
                  <span className="hub-org-name">{user.username}</span>
                  <span className="hub-org-meta">{user.email}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Checkout Card */}
          <aside className="hub-sidebar">
            <div className="hub-checkout-card">
              <div className="hub-price-header">
                <label>Order Summary</label>
                <span className="hub-main-price">
                  ₦{((selectedPricing?.price || price) * quantity).toLocaleString()}
                </span>
              </div>

              <div className="hub-availability">
                <div className="avail-header">
                  <span className="avail-label">Ticket Details</span>
                </div>
                <div className="summary-row">
                  <span>Ticket Type</span>
                  <span className="summary-value">{selectedPricing?.type || ticketType}</span>
                </div>
                <div className="summary-row">
                  <span>Price per ticket</span>
                  <span className="summary-value">
                    ₦{(selectedPricing?.price || price).toLocaleString()}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Quantity</span>
                  <span className="summary-value">{quantity}</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>Total Amount</span>
                  <span className="total-value">
                    ₦{((selectedPricing?.price || price) * quantity).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="hub-purchase-actions">
                <button
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="hub-buy-btn"
                >
                  {loading ? (
                    <>
                      <div className="spinner-small"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={20} />
                      <span>Complete Payment</span>
                    </>
                  )}
                </button>
              </div>

              <div className="hub-trust-tags">
                <div className="trust-tag">
                  <ShieldCheck size={14} />
                  <span>Secure Checkout</span>
                </div>
                <div className="trust-tag">
                  <ExternalLink size={14} />
                  <span>Instant Delivery</span>
                </div>
              </div>
            </div>

            <div className="hub-info-card">
              <AlertCircle size={18} />
              <p>Tickets are refundable up to 24 hours before the event start time.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}