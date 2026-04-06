import { useState } from "react";
import API from "../api/axios";
import { Link } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContexts";
import { useContext } from "react";
import icon from "../assets/icon.svg";
import "./CSS/forms.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { darkMode } = useContext(ThemeContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await API.post("/auth/forgot-password", { email });
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`form-page ${darkMode ? "dark-mode" : ""}`}>
      <div className="form-grid-background"></div>
      <div className="form-container">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              color: "inherit",
              marginBottom: "1rem",
            }}
          >
            <img src={icon} className="tickispot-icon" />
          </Link>
          <h1 className="form-title">Forgot Password</h1>
          <p className="form-subtitle">Enter your email to reset your password</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-alert form-alert-error">{error}</div>}
          {message && <div className="form-alert form-alert-success">{message}</div>}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="form-btn">
            {loading ? "Sending..." : "Send Reset Email"}
          </button>
        </form>

        <div className="form-footer">
          Remember your password?{" "}
          <Link to="/login" className="form-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}