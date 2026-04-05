import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import { ThemeContext } from "../contexts/ThemeContexts";
import { Search, MapPin, Calendar, Users, ArrowRight } from "lucide-react";
import EmptyState from "../components/EmptyState";
import useDemoEvents from "../hooks/useDemoEvents";
import "./CSS/home.css";

const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return new Intl.NumberFormat("en-NG").format(num);
};

const PORT_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080/api"
).replace(/\/api\/?$/, "");

export default function Home() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [useDemoData, setUseDemoData] = useState(false);

  const { darkMode } = useContext(ThemeContext);
  
  // Get demo events as fallback
  const demoEvents = useDemoEvents(events, error && !useDemoData);

  useEffect(() => {
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await API.get("/events");

      console.log("API RESPONSE:", res.data);

      // ✅ FIX: Handle both direct array and nested data structure
      const data = Array.isArray(res.data) 
        ? res.data 
        : Array.isArray(res.data?.data) 
        ? res.data.data 
        : [];

     console.log("RES.DATA TYPE:", typeof res.data, Array.isArray(res.data));

      setEvents(data);
      setFilteredEvents(data);
      setUseDemoData(false);
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setError("Failed to load events. Showing demo events instead.");
      setUseDemoData(true);
      // Use demo data as fallback
      setFilteredEvents(demoEvents);
    } finally {
      setLoading(false);
    }
  };

  fetchEvents();
}, []);




  const handleSearch = (term) => {
  setSearchTerm(term);
  
  if (!term.trim()) {
    setFilteredEvents(events);
    return;
  }

  const filtered = events.filter((event) => {
    const title = event?.title?.toLowerCase() || "";
    const location = event?.location?.toLowerCase() || "";
    const category = event?.category?.toLowerCase() || "";

    const searchLower = term.toLowerCase();
    
    return (
      title.includes(searchLower) ||
      location.includes(searchLower) ||
      category.includes(searchLower)
    );
  });

  setFilteredEvents(filtered);
};

  console.log("FILTERED EVENTS:", filteredEvents);

  return (
    <div className={`dashboard-page ${darkMode ? "dark-mode" : ""}`}>
      <div className="dashboard-container">

        {/* HEADER */}
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

        {/* LOADING */}
        {loading && (
          <div className="dash-card">
            <div className="dash-card-body center muted">
              Loading events…
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && !useDemoData && (
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

        {/* EVENTS */}
        {!loading && !error && (
          <>
            {!Array.isArray(filteredEvents) || filteredEvents.length === 0 ? (
              <EmptyState 
                type={searchTerm ? "no-search-results" : "no-events"}
                searchTerm={searchTerm}
              />
            ) : (
              <div className="events-grid">
                {filteredEvents.map((event) => (
                  <Link
                    to={`/eventdetail/${event._id}`}
                    key={event._id}
                    className="event-card"
                  >
                    {/* IMAGE */}
                    <div className="event-image-container">
                      {event?.image ? (
                        <img
                          src={`${PORT_URL}/uploads/event_image/${event.image}`}
                          alt={event.title}
                          className="event-image"
                        />
                      ) : (
                        <div className="event-image placeholder">
                          No Image
                        </div>
                      )}

                      {/* BADGES */}
                      <div className="event-floating-badges">
                        {event?.category && (
                          <span className="event-category-badge">
                            {event.category}
                          </span>
                        )}
                        {event?.liveStream?.isLive && (
                          <span className="live-pill-floating">
                            <span className="live-dot pulse"></span>
                            LIVE
                          </span>
                        )}
                      </div>

                      {/* HOVER */}
                      <div className="event-hover-overlay">
                        <span className="view-details-btn">
                          View Details <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>

                    {/* BODY */}
                    <div className="event-body">
                      <h3 className="event-title">
                        {event?.title || "Untitled Event"}
                      </h3>

                      <p className="event-desc">
                        {event?.description ||
                          "Join us for this amazing event."}
                      </p>

                      <div className="event-info-grid">
                        <div className="info-item">
                          <MapPin size={16} />
                          <span>
                            {event?.location || "Online / TBA"}
                          </span>
                        </div>

                        <div className="info-item">
                          <Calendar size={16} />
                          <span>
                            {event?.startDate
                              ? new Date(event.startDate).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )
                              : "Date TBA"}
                          </span>
                        </div>

                        <div className="info-item">
                          <Users size={16} />
                          <span>
                            {formatNumber(event?.ticketsSold)}/
                            {formatNumber(event?.totalTickets)} Attendees
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="event-footer">
                      {event?.createdBy?.profilePic ? (
                        <img
                          src={`${PORT_URL}/uploads/profile_pic/${event.createdBy.profilePic}`}
                          alt="Organizer"
                        />
                      ) : (
                        <div className="avatar-fallback">
                          {event?.createdBy?.username?.charAt(0) || "U"}
                        </div>
                      )}

                      <div>
                        <p className="organizer-name">
                          {event?.createdBy?.username ||
                            "Unknown Organizer"}
                        </p>
                        <span className="organizer-role">
                          Organizer
                        </span>
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