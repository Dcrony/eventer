import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import { ThemeContext } from "../contexts/ThemeContexts";
import { Search, MapPin, Calendar, Users, ArrowRight } from "lucide-react";
import "./CSS/home.css";

const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return new Intl.NumberFormat("en-NG").format(num);
};

const PORT_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    setLoading(true);
    setError(null);

    API.get("/events")
      .then((res) => {
        setEvents(res.data);
        setFilteredEvents(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load events. Please try again.");
        setLoading(false);
      });
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setFilteredEvents(
      events.filter(
        (event) =>
          event.title.toLowerCase().includes(term.toLowerCase()) ||
          event.location?.toLowerCase().includes(term.toLowerCase()) ||
          event.category?.toLowerCase().includes(term.toLowerCase()),
      ),
    );
  };

  return (
    <div className={`dashboard-page ${darkMode ? "dark-mode" : ""}`}>
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <div className="dashboard-title">Events</div>
            <div className="dashboard-subtitle">
              Browse and discover events on TickiSpot
            </div>
          </div>

          <div className="dashboard-actions">
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search by title, location or category..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="dash-search"
              />
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="dash-card">
            <div className="dash-card-body center muted">Loading events…</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="dash-card">
            <div className="dash-card-body center">
              <p className="error-text">{error}</p>
              <button
                className="dash-btn"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Events */}
        {!loading && !error && (
          <>
            {filteredEvents.length === 0 ? (
              <div className="dash-card">
                <div className="dash-card-body center muted">
                  {searchTerm
                    ? `No events found for "${searchTerm}".`
                    : "No events available yet."}
                </div>
              </div>
            ) : (
              <div className="events-grid">
                {filteredEvents.map((event) => (
                  <Link
                    to={`/eventdetail/${event._id}`}
                    key={event._id}
                    className="event-card"
                  >
                    {/* Modern Image Container */}
                    <div className="event-image-container">
                      {event.image ? (
                        <img
                          src={`${
                            import.meta.env.VITE_API_URL?.replace("/api", "") ||
                            PORT_URL
                          }/uploads/event_image/${event.image}`}
                          alt={event.title}
                          className="event-image"
                        />
                      ) : (
                        <div className="event-image placeholder">No Image</div>
                      )}

                      {/* Floating Badges */}
                      <div className="event-floating-badges">
                        {event.category && (
                          <span className="event-category-badge">
                            {event.category}
                          </span>
                        )}
                        {event.liveStream?.isLive && (
                          <span className="live-pill-floating">
                            <span className="live-dot pulse"></span>
                            LIVE
                          </span>
                        )}
                      </div>

                      {/* Hover Overlay */}
                      <div className="event-hover-overlay">
                        <span className="view-details-btn">
                          View Details <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="event-body">
                      <div className="event-title-row">
                        <h3 className="event-title">{event.title}</h3>
                      </div>

                      <p className="event-desc">
                        {event.description ||
                          "Join us for this amazing event and experience something unique."}
                      </p>

                      <div className="event-info-grid">
                        <div className="info-item">
                          <MapPin size={16} className="info-icon" />
                          <span>{event.location || "Online / TBA"}</span>
                        </div>
                        <div className="info-item">
                          <Calendar size={16} className="info-icon" />
                          <span>
                            {new Date(event.startDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <div className="info-item tickets-info">
                          <Users size={16} className="info-icon" />
                          <span>
                            {formatNumber(event.ticketsSold)}/
                            {formatNumber(event.totalTickets)} Attendee
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Organizer */}
                    <div className="event-footer">
                      {event.createdBy?.profilePic ? (
                        <img
                          src={`${PORT_URL}/uploads/profile_pic/${event.createdBy.profilePic}`}
                          alt="Organizer"
                        />
                      ) : (
                        <div className="avatar-fallback">
                          {event.createdBy?.username?.charAt(0) || "U"}
                        </div>
                      )}
                      <div>
                        <p className="organizer-name">
                          {event.createdBy?.username || "Unknown Organizer"}
                        </p>
                        <span className="organizer-role">Organizer</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
