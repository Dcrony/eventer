import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
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
  AlertCircle
} from "lucide-react";
import "./CSS/checkout.css";

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
    <div className={`checkout-page ${darkMode ? "dark-mode" : ""}`}>
      {/* Background Pattern */}
      <div className="checkout-bg-pattern"></div>
      
      <div className="checkout-container">
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="checkout-back-nav">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Main Checkout Card */}
        <div className="checkout-card">
          {/* Header with Progress */}
          <div className="checkout-header">
            <div className="checkout-progress">
              <div className="progress-step active">
                <span className="step-number">1</span>
                <span className="step-label">Details</span>
              </div>
              <div className="progress-line"></div>
              <div className="progress-step active">
                <span className="step-number">2</span>
                <span className="step-label">Payment</span>
              </div>
              <div className="progress-line"></div>
              <div className="progress-step">
                <span className="step-number">3</span>
                <span className="step-label">Confirmation</span>
              </div>
            </div>
            
            <div className="header-content">
              <h1>Complete Your Purchase</h1>
              <p>You're just one step away from securing your tickets</p>
            </div>
          </div>

          {/* Event Summary Card */}
          <div className="event-summary-card">
            <div className="event-image-placeholder">
              {event.image ? (
                <img 
                  src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/event_image/${event.image}`}
                  alt={event.title}
                  className="event-image"
                />
              ) : (
                <Ticket size={32} className="placeholder-icon" />
              )}
            </div>
            <div className="event-summary-details">
              <h2>{event.title}</h2>
              <div className="event-meta">
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>{formatDate(event.startDate)}</span>
                </div>
                <div className="meta-item">
                  <Clock size={14} />
                  <span>{event.startTime}</span>
                </div>
                <div className="meta-item">
                  <MapPin size={14} />
                  <span>{event.location || "Online Event"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Type Selection */}
          {event.pricing && event.pricing.length > 1 && (
            <div className="checkout-section">
              <div className="section-header">
                <Ticket size={18} className="section-icon" />
                <h3>Select Ticket Type</h3>
              </div>
              <div className="ticket-types-grid">
                {event.pricing.map((pricing, index) => (
                  <button
                    key={index}
                    className={`ticket-type-card ${
                      selectedPricing?.type === pricing.type ? "selected" : ""
                    }`}
                    onClick={() => setSelectedPricing(pricing)}
                  >
                    <div className="ticket-type-header">
                      <span className="ticket-type-name">{pricing.type}</span>
                      {selectedPricing?.type === pricing.type && (
                        <CheckCircle size={16} className="selected-icon" />
                      )}
                    </div>
                    <div className="ticket-type-price">
                      ₦{pricing.price.toLocaleString()}
                    </div>
                    <div className="ticket-type-perks">
                      {pricing.perks?.map((perk, i) => (
                        <span key={i} className="perk-badge">{perk}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Buyer Information */}
          <div className="checkout-section">
            <div className="section-header">
              <User size={18} className="section-icon" />
              <h3>Buyer Information</h3>
            </div>
            <div className="buyer-info-card">
              <div className="buyer-info-row">
                <User size={16} className="info-icon" />
                <span className="info-label">Name:</span>
                <span className="info-value">{user.username}</span>
              </div>
              <div className="buyer-info-row">
                <Mail size={16} className="info-icon" />
                <span className="info-label">Email:</span>
                <span className="info-value">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="checkout-section">
            <div className="section-header">
              <CreditCard size={18} className="section-icon" />
              <h3>Order Summary</h3>
            </div>
            <div className="order-summary">
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
          </div>

          {/* Payment Security Badge */}
          <div className="security-badge">
            <Lock size={14} />
            <span>Secure payment powered by Paystack</span>
          </div>

          {/* Action Buttons */}
          <div className="checkout-actions">
            <button
              onClick={handleConfirmPayment}
              disabled={loading}
              className="checkout-pay-btn"
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Pay ₦{((selectedPricing?.price || price) * quantity).toLocaleString()}</span>
                </>
              )}
            </button>
          </div>

          {/* Trust Badges */}
          <div className="trust-badges">
            <div className="trust-badge">
              <Shield size={14} />
              <span>Money-back guarantee</span>
            </div>
            <div className="trust-badge">
              <CheckCircle size={14} />
              <span>Instant ticket delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}