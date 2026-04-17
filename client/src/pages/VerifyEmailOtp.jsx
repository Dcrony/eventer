import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api/axios";
import "./CSS/forms.css";

const PENDING_CODE_KEY = "pendingVerificationCode";

const VerifyEmailOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);
  const [resendLoading, setResendLoading] = useState(false);
  const [displayedCode, setDisplayedCode] = useState("");

  const email = location.state?.email || localStorage.getItem("verifyEmail");

  useEffect(() => {
    const fromNav = location.state?.verificationCode;
    const fromStore = sessionStorage.getItem(PENDING_CODE_KEY);
    const code = fromNav ?? fromStore ?? "";
    setDisplayedCode(code);
    if (fromNav) sessionStorage.setItem(PENDING_CODE_KEY, fromNav);
  }, [location.state?.verificationCode, location.key]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length !== 6) return;
    e.preventDefault();
    const digits = text.split("");
    setOtp(digits);
    const last = document.getElementById("otp-input-5");
    if (last) last.focus();
  };

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

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.removeItem("verifyEmail");
      sessionStorage.removeItem(PENDING_CODE_KEY);

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

  const handleResendOtp = async () => {
    if (!email) {
      setError("Email not found. Please sign up again.");
      return;
    }

    setError("");
    setResendLoading(true);

    try {
      const { data } = await API.post("/auth/resend-otp", { email });

      if (data.verificationCode) {
        setDisplayedCode(data.verificationCode);
        sessionStorage.setItem(PENDING_CODE_KEY, data.verificationCode);
      }

      setSuccess(
        data.verificationCode
          ? "✅ New code generated — copy it below."
          : "✅ New code sent to your email."
      );
      setTimeLeft(600);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to get a new code. Please try again.";
      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

  const copyCode = async () => {
    if (!displayedCode) return;
    try {
      await navigator.clipboard.writeText(displayedCode);
      setSuccess("✅ Code copied");
      setTimeout(() => setSuccess(""), 2000);
    } catch {
      setError("Could not copy — select the code and copy manually.");
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
          <h1 className="form-title">Verify your email</h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>
            Enter the 6-digit code for <br />
            <strong>{email}</strong>
          </p>
        </div>

        {displayedCode ? (
          <div
            style={{
              padding: "1rem 1.25rem",
              marginBottom: "1.25rem",
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", color: "#166534" }}>
              Your verification code (copy and paste into the boxes below)
            </p>
            <div
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: "#0f172a",
                userSelect: "all",
              }}
            >
              {displayedCode}
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="form-button"
              style={{ marginTop: "0.75rem", maxWidth: "200px" }}
            >
              Copy code
            </button>
          </div>
        ) : (
          <p
            style={{
              textAlign: "center",
              color: "#64748b",
              fontSize: "0.95rem",
              marginBottom: "1.25rem",
            }}
          >
            If email delivery is configured, check your inbox for the code. You can also
            use &quot;Get new code&quot; below.
          </p>
        )}

        <div
          style={{
            padding: "1rem",
            textAlign: "center",
            backgroundColor: timeLeft < 120 ? "#fff3cd" : "#e7f3ff",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            fontSize: "0.95rem",
            color: timeLeft < 120 ? "#856404" : "#004085",
          }}
        >
          ⏱️ Code expires in: <strong>{formatTime(timeLeft)}</strong>
        </div>

        <form onSubmit={handleVerifyOtp}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
            onPaste={handlePaste}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-input-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                placeholder="-"
                disabled={loading}
                autoComplete="one-time-code"
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
            style={{ opacity: otp.some((digit) => !digit) ? 0.6 : 1 }}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid #ddd",
          }}
        >
          <p style={{ color: "#666", marginBottom: "0.5rem" }}>
            Need a new code?
          </p>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendLoading}
            style={{
              background: "none",
              border: "none",
              color: resendLoading ? "#ccc" : "#007bff",
              cursor: resendLoading ? "not-allowed" : "pointer",
              fontSize: "1rem",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            {resendLoading ? "Working..." : "Get new code"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailOtp;
