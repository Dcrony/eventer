import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [status, setStatus] = useState(null); // 'success', 'error', or null

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
        message: 'Payment failed. Please try again or contact support if the issue persists.'
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear preset selection if custom amount is being entered
    if (name === 'amount') {
      setSelectedPreset(null);
    }
  };

  const handlePresetSelect = (amount) => {
    setSelectedPreset(amount);
    setFormData(prev => ({
      ...prev,
      amount: amount.toString()
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Full name is required";
    if (!formData.email.trim()) return "Email address is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Please enter a valid email address";
    if (!formData.amount || parseFloat(formData.amount) <= 0) return "Please enter a valid donation amount";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setStatus({ type: 'error', message: validationError });
      return;
    }

    setIsLoading(true);
    setStatus(null);

    try {
      const response = await API.post('/donations', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        amount: parseFloat(formData.amount),
        message: formData.message.trim()
      });

      if (response.data.success) {
        // Redirect to Paystack payment page
        window.location.href = response.data.authorization_url;
      } else {
        setStatus({ type: 'error', message: 'Failed to initiate donation. Please try again.' });
      }
    } catch (error) {
      console.error('Donation error:', error);
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'An error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      amount: "",
      message: ""
    });
    setSelectedPreset(null);
    setStatus(null);
  };

  return (
    <div className="landing-page">
      <div className="grid-background"></div>

      <div
        className="page-container"
        style={{
          paddingTop: "120px",
          paddingBottom: "80px",
          maxWidth: "1200px",
          margin: "0 auto",
          paddingLeft: "20px",
          paddingRight: "20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="section-header animate-in">
          <h1 className="section-title">
            <span className="title-box title-box-border">Support</span>
            <span className="title-box title-box-filled">Our Mission</span>
          </h1>
          <p className="section-subtitle">
            TickiSpot is built to empower event creators. Your support helps us
            improve, innovate, and keep the platform accessible to everyone.
          </p>
        </div>

        {!showForm ? (
          <div style={{ textAlign: "center", marginTop: "40px" }}>
            {status?.type === 'success' ? (
              <div
                className="feature-card animate-in"
                style={{
                  maxWidth: "600px",
                  margin: "0 auto",
                  backgroundColor: "#d1fae5",
                  borderColor: "#a7f3d0"
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: "3rem",
                    marginBottom: "16px",
                    color: "#059669"
                  }}>
                    ✅
                  </div>
                  <h3 style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                    color: "#065f46"
                  }}>
                    Donation Successful!
                  </h3>
                  <p style={{
                    color: "#047857",
                    fontSize: "1rem",
                    marginBottom: "16px"
                  }}>
                    {status.message}
                  </p>
                  {status.reference && (
                    <p style={{
                      fontSize: "0.9rem",
                      color: "#065f46",
                      fontFamily: "monospace",
                      backgroundColor: "#ecfdf5",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      display: "inline-block"
                    }}>
                      Reference: {status.reference}
                    </p>
                  )}
                  <div style={{ marginTop: "24px" }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setStatus(null);
                        setShowForm(true);
                      }}
                      style={{ marginRight: "12px" }}
                    >
                      Make Another Donation
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => window.location.href = '/'}
                    >
                      Back to Home
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
                style={{ fontSize: "1.1rem", padding: "1rem 2rem" }}
              >
                Donate Now
              </button>
            )}
          </div>
        ) : (
          <div
            className="feature-card animate-in"
            style={{
              maxWidth: "600px",
              margin: "40px auto 0",
              transition: "all 0.3s ease"
            }}
          >
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                marginBottom: "8px",
                color: "#102038"
              }}>
                Make a Donation
              </h3>
              <p style={{
                color: "#607089",
                fontSize: "0.95rem",
                marginBottom: "0"
              }}>
                Your contribution helps us build a better platform for event creators.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Full Name */}
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#102038"
                }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "16px",
                    transition: "border-color 0.2s ease",
                    outline: "none"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#ec4899"}
                  onBlur={(e) => e.target.style.borderColor = "#ddd"}
                />
              </div>

              {/* Email Address */}
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#102038"
                }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "16px",
                    transition: "border-color 0.2s ease",
                    outline: "none"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#ec4899"}
                  onBlur={(e) => e.target.style.borderColor = "#ddd"}
                />
              </div>

              {/* Donation Amount */}
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "12px",
                  fontWeight: "600",
                  color: "#102038"
                }}>
                  Donation Amount *
                </label>

                {/* Preset Amounts */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: "8px",
                  marginBottom: "16px"
                }}>
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handlePresetSelect(preset.value)}
                      style={{
                        padding: "12px",
                        borderRadius: "8px",
                        border: selectedPreset === preset.value ? "2px solid #ec4899" : "1px solid #ddd",
                        background: selectedPreset === preset.value ? "#fce7f3" : "#ffffff",
                        color: selectedPreset === preset.value ? "#be185d" : "#102038",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontSize: "14px"
                      }}
                      onMouseEnter={(e) => {
                        if (selectedPreset !== preset.value) {
                          e.target.style.borderColor = "#ec4899";
                          e.target.style.backgroundColor = "#fce7f3";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedPreset !== preset.value) {
                          e.target.style.borderColor = "#ddd";
                          e.target.style.backgroundColor = "#ffffff";
                        }
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "0.9rem",
                    color: "#607089",
                    fontWeight: "500"
                  }}>
                    Or enter custom amount (₦)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    min="1"
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      fontSize: "16px",
                      transition: "border-color 0.2s ease",
                      outline: "none"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#ec4899"}
                    onBlur={(e) => e.target.style.borderColor = "#ddd"}
                  />
                </div>
              </div>

              {/* Optional Message */}
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#102038"
                }}>
                  Message (Optional)
                </label>
                <textarea
                  name="message"
                  placeholder="Leave a message of support..."
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={200}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "16px",
                    resize: "vertical",
                    transition: "border-color 0.2s ease",
                    outline: "none"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#ec4899"}
                  onBlur={(e) => e.target.style.borderColor = "#ddd"}
                />
                <div style={{
                  fontSize: "0.8rem",
                  color: "#8b99ad",
                  textAlign: "right",
                  marginTop: "4px"
                }}>
                  {formData.message.length}/200
                </div>
              </div>

              {/* Status Messages */}
              {status && (
                <div style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  backgroundColor: status.type === 'error' ? '#fee2e2' : '#d1fae5',
                  border: `1px solid ${status.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
                  color: status.type === 'error' ? '#dc2626' : '#059669'
                }}>
                  {status.message}
                </div>
              )}

              {/* Trust Text */}
              <div style={{
                textAlign: "center",
                fontSize: "0.85rem",
                color: "#8b99ad",
                marginBottom: "8px"
              }}>
                🔒 Secure payments powered by Paystack
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? "not-allowed" : "pointer"
                }}
              >
                {isLoading ? "Processing..." : "Continue to Payment"}
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="btn btn-outline"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginTop: "8px"
                }}
              >
                Back
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
