import { useState, useEffect } from "react";
import API from "../api/axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";
import icon from "../assets/icon.svg";
import "./CSS/forms.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/reset-password", { token, newPassword: password });
      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="form-page">
        <div className="form-container">
          <div className="form-alert form-alert-error">Invalid reset link.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-grid-background"></div>
      <div className="form-container">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img src={icon} className="tickispot-icon" />
          <h1 className="form-title">Reset Password</h1>
          <p className="form-subtitle">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-alert form-alert-error">{error}</div>}
          {message && <div className="form-alert form-alert-success">{message}</div>}

          <div className="form-group">
            <label className="form-label">New Password</label>
            <PasswordInput
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <PasswordInput
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="form-btn">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}