import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useState } from "react";
import "./CSS/checkout.css";

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { event, quantity, user, ticketType, price } = state || {};

  // ✅ Check if all necessary data exists
  if (!event || !quantity || !user || !ticketType || !price) {
    return <p>Invalid checkout details</p>;
  }

  const totalAmount = price * quantity;

  // ✅ Add state for selected pricing option
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

    // ✅ Redirect to Paystack
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


  return (
    <div className="checkout-page">
      <div className="checkout-card">
        {/* Header */}
        <div className="checkout-header">
          <h1>Checkout</h1>
          <p>Confirm your ticket purchase</p>
        </div>

        {/* Event */}
        <div className="checkout-section">
          <h2 className="checkout-title">{event.title}</h2>
          <p className="checkout-muted">{event.description}</p>
          <div className="checkout-meta">
            <span>📅 {new Date(event.startDate).toLocaleDateString()}</span>
            <span>⏰ {event.startTime}</span>
            <span>📍 {event.location}</span>
          </div>
        </div>

        {/* Buyer */}
        <div className="checkout-section">
          <h3>Buyer Info</h3>
          <p>👤 {user.username}</p>
          <p>📧 {user.email}</p>
        </div>

        {/* Pricing Selection */}
        {event.pricing && event.pricing.length > 1 && (
          <div className="checkout-section">
            <h3>Select Ticket Type</h3>
            <div className="pricing-options">
              {event.pricing.map((pricing, index) => (
                <button
                  key={index}
                  className={`pricing-option ${
                    selectedPricing?.type === pricing.type ? "selected" : ""
                  }`}
                  onClick={() => setSelectedPricing(pricing)}
                >
                  <div>
                    <strong>{pricing.type}</strong>
                    <p>₦{pricing.price.toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="checkout-summary">
          <div className="checkout-row">
            <span>Ticket Type</span>
            <strong>{selectedPricing?.type || ticketType}</strong>
          </div>
          <div className="checkout-row">
            <span>Price per ticket</span>
            <strong>
              ₦{(selectedPricing?.price || price).toLocaleString()}
            </strong>
          </div>
          <div className="checkout-row">
            <span>Quantity</span>
            <strong>{quantity}</strong>
          </div>
          <div className="checkout-row total">
            <span>Total</span>
            <strong>
              ₦{((selectedPricing?.price || price) * quantity).toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Actions */}
        <div className="checkout-actions">
          <button
            onClick={handleConfirmPayment}
            disabled={loading}
            className="checkout-pay-btn"
          >
            {loading ? "Processing..." : "Confirm & Pay"}
          </button>
          <button onClick={() => navigate(-1)} className="checkout-back-btn">
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
