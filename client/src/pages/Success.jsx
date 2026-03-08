import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Ticket, ArrowRight, Home } from "lucide-react";
import "./CSS/success.css";

export default function Success() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect to tickets after 10 seconds
    const timer = setTimeout(() => {
      navigate("/my-tickets");
    }, 100000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="success-page">
      <div className="success-container">
        {/* Success Animation */}
        <div className="success-icon-wrapper">
          <div className="success-icon-circle">
            <CheckCircle size={64} className="success-icon" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="success-title">Payment Successful! 🎉</h1>
        <p className="success-message">
          Your ticket has been created and confirmed.
        </p>

        {/* Ticket Preview */}
        <div className="ticket-preview">
          <div className="ticket-preview-header">
            <Ticket size={20} />
            <span>Your Ticket</span>
          </div>
          <div className="ticket-preview-body">
            <p className="ticket-preview-text">
              A confirmation has been sent to your email
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="success-actions">
          <Link to="/my-tickets" className="success-btn primary">
            <Ticket size={18} />
            View My Tickets
            <ArrowRight size={18} />
          </Link>

          <Link to="/events" className="success-btn secondary">
            <Home size={18} />
            Browse More Events
          </Link>
        </div>

        {/* Auto-redirect Info */}
        <p className="redirect-info">
          Redirecting to your tickets in 10 seconds...
        </p>
      </div>
    </div>
  );
}