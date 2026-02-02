import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContexts";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  Share2,
  Heart,
  Ticket,
  ExternalLink,
  ShieldCheck,
  Info,
} from "lucide-react";
import "./CSS/eventdetail.css";

export default function EventDetail() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState({});
  const { darkMode } = useContext(ThemeContext);
  const user = JSON.parse(localStorage.getItem("user"));
  const isLoggedIn = !!localStorage.getItem("token");
  const navigate = useNavigate();

  const PORT_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ✅ Function declaration is hoisted, can be used anywhere
  function formatPrice(price) {
    if (!price || isNaN(price)) return "Free";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(price);
  }

  // State for selected ticket type
  const [selectedTicketType, setSelectedTicketType] = useState(null);

  useEffect(() => {
    API.get(`/events/${eventId}`)
      .then((res) => {
        setEvent(res.data);
        // Initialize selected ticket type once data is fetched
        if (res.data.pricing && res.data.pricing.length > 0) {
          setSelectedTicketType(res.data.pricing[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventId]);

  const handleBuy = () => {
    if (!isLoggedIn) {
      alert("Please login to purchase tickets.");
      navigate("/login");
      return;
    }

    if (!selectedTicketType) {
      alert("Please select a ticket type.");
      return;
    }

    const quantity = parseInt(buying[event._id]) || 1;

    navigate(`/checkout/${event._id}`, {
      state: {
        event,
        quantity,
        ticketType: selectedTicketType.type,
        price: selectedTicketType.price,
        user,
      },
    });
  };

  if (loading)
    return (
      <div className="event-loader-container">
        <div className="loader-spinner"></div>
        <p>Fetching event details...</p>
      </div>
    );

  if (!event)
    return (
      <div className="event-not-found">
        <Info size={48} />
        <h2>Event not found</h2>
        <Link to="/events" className="dash-btn">
          Return to Browse
        </Link>
      </div>
    );

  return (
    <div className={`event-hub ${darkMode ? "dark-mode" : ""}`}>
      {/* Glassy Background Blur */}
      <div className="hub-bg-blur">
        {event.image && (
          <img
            src={`${PORT_URL.replace("/api", "")}/uploads/event_image/${event.image}`}
            alt={event.title}
          />
        )}
      </div>

      <div className="hub-container">
        {/* Top Navigation Bar */}
        <header className="hub-header">
          <button onClick={() => navigate("/events")} className="hub-back-btn">
            <ArrowLeft size={18} />
            <span>Back to Browse</span>
          </button>
          <div className="hub-header-actions">
            <button className="hub-circle-btn" title="Share">
              <Share2 size={18} />
            </button>
            <button className="hub-circle-btn" title="Save">
              <Heart size={18} />
            </button>
          </div>
        </header>

        {/* Main Hub Layout */}
        <div className="hub-main">
          {/* Left Column: Content */}
          <section className="hub-content">
            <div className="hub-image-wrapper">
              {event.image ? (
                <img
                  src={`${PORT_URL.replace("/api", "")}/uploads/event_image/${event.image}`}
                  alt={event.title}
                  className="hub-main-img"
                />
              ) : (
                <div className="hub-img-placeholder">
                  <Calendar size={80} />
                </div>
              )}
            </div>

            <div className="hub-title-section">
              <div className="hub-category-row">
                {event.category && <span className="hub-badge">{event.category}</span>}
                <span className="hub-badge outline">{event.eventType || "In-Person"}</span>
              </div>
              <h1 className="hub-title">{event.title}</h1>
            </div>

            <div className="hub-about">
              <h3 className="hub-section-label">About the Event</h3>
              <p className="hub-description">{event.description}</p>
            </div>

            <div className="hub-details-grid">
              <div className="hub-detail-item">
                <div className="hub-detail-icon">
                  <Calendar />
                </div>
                <div className="hub-detail-info">
                  <label>Date</label>
                  <span>
                    {new Date(event.startDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="hub-detail-item">
                <div className="hub-detail-icon">
                  <Clock />
                </div>
                <div className="hub-detail-info">
                  <label>Time</label>
                  <span>{event.startTime || "Check description"}</span>
                </div>
              </div>
              <div className="hub-detail-item">
                <div className="hub-detail-icon">
                  <MapPin />
                </div>
                <div className="hub-detail-info">
                  <label>Location</label>
                  <span>{event.location || "Online Event"}</span>
                </div>
              </div>
              <div className="hub-detail-item">
                <div className="hub-detail-icon">
                  <Users />
                </div>
                <div className="hub-detail-info">
                  <label>Attendees</label>
                  <span>{event.ticketsSold || 0} People attending</span>
                </div>
              </div>
            </div>

            {/* Organizer Section */}
            <div className="hub-organizer">
              <h3 className="hub-section-label">Organized By</h3>
              <div className="hub-organizer-card">
                {event.createdBy?.profilePic ? (
                  <img
                    src={`${PORT_URL.replace("/api", "")}/uploads/profile_pic/${event.createdBy.profilePic}`}
                    alt={event.createdBy.username}
                    className="hub-org-avatar"
                  />
                ) : (
                  <div className="hub-org-avatar-fallback">
                    {event.createdBy?.username?.charAt(0)}
                  </div>
                )}
                <div className="hub-org-text">
                  <span className="hub-org-name">
                    {event.createdBy?.username || "TickiSpot Organizer"}
                  </span>
                  <span className="hub-org-meta">Verified Host • 5 ★ Rating</span>
                </div>
                <button className="hub-contact-btn">Message</button>
              </div>
            </div>
          </section>

          {/* Right Column: Checkout Card */}
          <aside className="hub-sidebar">
            <div className="hub-checkout-card">
              <div className="hub-price-header">
                <label>Tickets starting from</label>
                <span className="hub-main-price">
                  {event.pricing && event.pricing.length > 0
                    ? formatPrice(event.pricing[0].price)
                    : "Free"}
                </span>
              </div>

              {event.pricing && event.pricing.length > 0 && (
                <div className="hub-ticket-types">
                  <label className="hub-label">Select Ticket Type</label>
                  {event.pricing.map((p) => (
                    <label
                      key={p._id}
                      className={`ticket-type-option ${
                        selectedTicketType?.type === p.type ? "active" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="ticketType"
                        value={p.type}
                        onChange={() => setSelectedTicketType(p)}
                      />
                      <span>{p.type}</span>
                      <b>{formatPrice(p.price)}</b>
                    </label>
                  ))}
                </div>
              )}

              <div className="hub-availability">
                <div className="avail-bar">
                  <div
                    className="avail-fill"
                    style={{
                      width: `${(event.ticketsSold / event.totalTickets) * 100}%`,
                    }}
                  ></div>
                </div>
                <span>
                  Only {event.totalTickets - (event.ticketsSold || 0)} tickets left!
                </span>
              </div>

              <div className="hub-purchase-actions">
                <div className="hub-qty-select">
                  <label>Quantity</label>
                  <select
                    value={buying[event._id] || "1"}
                    onChange={(e) =>
                      setBuying({ ...buying, [event._id]: e.target.value })
                    }
                  >
                    {[1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <button onClick={handleBuy} className="hub-buy-btn">
                  <Ticket size={20} />
                  <span>Get Tickets Now</span>
                </button>
              </div>

              <div className="hub-trust-tags">
                <div className="trust-tag">
                  <ShieldCheck size={14} />
                  <span>Secure Checkout</span>
                </div>
                <div className="trust-tag">
                  <ExternalLink size={14} />
                  <span>Instant Delivery</span>
                </div>
              </div>
            </div>

            <div className="hub-info-card">
              <Info size={18} />
              <p>Tickets are refundable up to 24 hours before the event start time.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
