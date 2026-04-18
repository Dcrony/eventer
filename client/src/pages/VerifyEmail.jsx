import { useState, useEffect } from "react";
import API from "../api/axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import icon from "../assets/icon.svg";
import "./CSS/forms.css";

export default function VerifyEmail() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError(
        "This link is invalid. New accounts verify with a 6-digit code on the verify page after sign up."
      );
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        await API.post("/auth/verify-email", { token });
        setMessage("Email verified successfully! You can now log in.");
        setTimeout(() => navigate("/login"), 3000);
      } catch (err) {
        setError(err.response?.data?.message || "Verification failed.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="form-page">
      <div className="form-grid-background"></div>
      <div className="form-container">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img src={icon} className="tickispot-icon" />
          <h1 className="form-title">Email Verification</h1>
        </div>

        {loading && <div className="form-alert">Verifying your email...</div>}
        {error && <div className="form-alert form-alert-error">{error}</div>}
        {message && <div className="form-alert form-alert-success">{message}</div>}
      </div>
    </div>
  );
}