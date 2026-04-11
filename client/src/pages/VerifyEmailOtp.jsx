import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api/axios";
import "./CSS/forms.css";

const VerifyEmailOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [resendLoading, setResendLoading] = useState(false);

  // Get email from location state or localStorage
  const email = location.state?.email || localStorage.getItem("verifyEmail");

  // Timer for OTP expiration
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Handle OTP input - only numbers
  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle backspace to move to previous input
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Submit OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Email not found. Please sign up again.");
      return;
    }

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/verify-otp", {
        email,
        otp: otpCode,
      });

      setSuccess("✅ Email verified successfully!");

      // Store token and user
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.removeItem("verifyEmail");

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to verify OTP. Please try again.";
      setError(message);
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!email) {
      setError("Email not found. Please sign up again.");
      return;
    }

    setError("");
    setResendLoading(true);

    try {
      await API.post("/auth/resend-otp", { email });

      setSuccess("✅ New code sent to your email!");
      setTimeLeft(600); // Reset timer
      setOtp(["", "", "", "", "", ""]);

      // Clear messages after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to resend OTP. Please try again.";
      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="form-page">
        <div className="form-grid-background"></div>
        <div className="form-container">
          <div className="form-alert form-alert-error">
            ❌ Email not found. Please sign up again.
          </div>
          <button
            onClick={() => navigate("/signup")}
            className="form-button"
          >
            Back to Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-grid-background"></div>
      <div className="form-container">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 className="form-title">Verify Your Email</h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>
            We sent a 6-digit code to <br />
            <strong>{email}</strong>
          </p>
        </div>

        {/* Timer */}
        <div style={{
          padding: "1rem",
          textAlign: "center",
          backgroundColor: timeLeft < 120 ? "#fff3cd" : "#e7f3ff",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
          color: timeLeft < 120 ? "#856404" : "#004085",
        }}>
          ⏱️ Code expires in: <strong>{formatTime(timeLeft)}</strong>
        </div>

        {/* OTP Input */}
        <form onSubmit={handleVerifyOtp}>
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-input-${index}`}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                placeholder="-"
                disabled={loading}
                style={{
                  width: "50px",
                  height: "50px",
                  fontSize: "24px",
                  textAlign: "center",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: loading ? "not-allowed" : "text",
                  backgroundColor: loading ? "#f5f5f5" : "#fff",
                }}
              />
            ))}
          </div>

          {error && <div className="form-alert form-alert-error">{error}</div>}
          {success && <div className="form-alert form-alert-success">{success}</div>}

          <button
            type="submit"
            className="form-button"
            disabled={loading || otp.some((digit) => !digit)}
            style={{ opacity: otp.some((digit) => !digit) ? "0.6" : "1" }}
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        {/* Resend OTP */}
        <div style={{
          textAlign: "center",
          marginTop: "1.5rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid #ddd",
        }}>
          <p style={{ color: "#666", marginBottom: "0.5rem" }}>
            Didn't receive the code?
          </p>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendLoading || timeLeft > 540}
            style={{
              background: "none",
              border: "none",
              color: resendLoading || timeLeft > 540 ? "#ccc" : "#007bff",
              cursor: resendLoading || timeLeft > 540 ? "not-allowed" : "pointer",
              fontSize: "1rem",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            {resendLoading ? "Sending..." : "Resend Code"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailOtp;
