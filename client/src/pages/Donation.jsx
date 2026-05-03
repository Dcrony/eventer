import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react"; // Optional: for a close icon
import API from "../api/axios";
import "./CSS/landing.css";

export default function Donation() {
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    amount: "",
    message: ""
  });
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    const reference = searchParams.get('reference');

    if (statusParam === 'success') {
      setStatus({
        type: 'success',
        message: 'Thank you for your donation! Your payment has been processed successfully.',
        reference
      });
      setShowForm(false);
    } else if (statusParam === 'failed') {
      setStatus({
        type: 'error',
        message: 'Payment failed. Please try again.'
      });
      setShowForm(true);
    }
  }, [searchParams]);

  const presetAmounts = [
    { value: 500, label: "₦500" },
    { value: 1000, label: "₦1,000" },
    { value: 5000, label: "₦5,000" },
    { value: 10000, label: "₦10,000" }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'amount') setSelectedPreset(null);
  };

  const handlePresetSelect = (amount) => {
    setSelectedPreset(amount);
    setFormData(prev => ({ ...prev, amount: amount.toString() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await API.post('/donations', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      if (response.data.success) {
        window.location.href = response.data.authorization_url;
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setStatus(null);
  };

  return (
    <div className="landing-page">
      <div className="grid-background"></div>

      <div className="page-container" style={{ paddingTop: "120px", textAlign: "center" }}>
        <div className="section-header animate-in">
          <h1 className="section-title">
            <span className="title-box title-box-border">Support</span>
            <span className="title-box title-box-filled">Our Mission</span>
          </h1>
          <p className="section-subtitle">
            Your support helps us improve, innovate, and keep the platform accessible.
          </p>
        </div>

        {/* Success Message outside Modal */}
        {status?.type === 'success' ? (
          <div className="success-banner">
             <p>✅ {status.message}</p>
             <button className="btn btn-primary" onClick={() => setShowForm(true)}>Donate Again</button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: "30px" }}>
            Donate Now
          </button>
        )}
      </div>

      {/* --- PURE CSS MODAL SECTION --- */}
      {showForm && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content animate-pop" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>&times;</button>
            
            <div className="modal-header">
              <h3>Make a Donation</h3>
              <p>Your contribution helps us build a better platform.</p>
            </div>

            <form onSubmit={handleSubmit} className="donation-form">
              <div className="input-group">
                <label>Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>

              <div className="input-group">
                <label>Email Address *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>

              <div className="input-group">
                <label>Donation Amount (₦) *</label>
                <div className="preset-grid">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className={selectedPreset === preset.value ? "preset-btn active" : "preset-btn"}
                      onClick={() => handlePresetSelect(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input type="number" name="amount" placeholder="Custom amount" value={formData.amount} onChange={handleInputChange} className="custom-amount-input" />
              </div>

              <div className="input-group">
                <label>Message (Optional)</label>
                <textarea name="message" value={formData.message} onChange={handleInputChange} rows={2} maxLength={200} />
              </div>

              {status?.type === 'error' && <div className="error-msg">{status.message}</div>}

              <button type="submit" className="btn btn-primary full-width" disabled={isLoading}>
                {isLoading ? "Processing..." : "Continue to Payment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}