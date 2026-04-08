import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import { Search, MapPin, Calendar, Users, ArrowRight, Ticket } from "lucide-react";
import EmptyState from "../components/EmptyState";
import useDemoEvents from "../hooks/useDemoEvents";
import useProfileNavigation from "../hooks/useProfileNavigation";
import { DEMO_EVENTS } from "../utils/demoEvents";
import { PORT_URL } from "../utils/config";
import icon from "../assets/icon.svg";
import "./CSS/home.css";

const EVENT_FILTER_CHIPS = [
  { id: "all", label: "All" },
  { id: "music", label: "Music" },
  { id: "tech", label: "Tech" },
  { id: "business", label: "Business" },
  { id: "food", label: "Food" },
  { id: "sports", label: "Sports" },
  { id: "online", label: "Online" },
];

const eventRowKey = (event) => event._id ?? event.title;

const getEventImageSrc = (event) => {
  if (event?.banner) return event.banner;
  if (event?.image) return `${PORT_URL}/uploads/event_image/${event.image}`;
  return null;
};

const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return new Intl.NumberFormat("en-NG").format(num);
};

export default function Home() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [useDemoData, setUseDemoData] = useState(false);
  const [brokenImages, setBrokenImages] = useState(() => new Set());
  const [filterVisual, setFilterVisual] = useState("all");
  const [sortVisual, setSortVisual] = useState("newest");

  // Get demo events as fallback
  const demoEvents = useDemoEvents(events, error && !useDemoData);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await API.get("/events");

        // ✅ FIX: Handle both direct array and nested data structure
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        setEvents(data);
        setFilteredEvents(data);
        setUseDemoData(false);
      } catch (err) {
        console.error("FETCH ERROR:", {
          status: err.response?.status,
          message: err.response?.data?.message || err.message,
          data: err.response?.data,
        });
        setError("Failed to load events. Showing demo events instead.");
        setUseDemoData(true);
        setEvents([]);
        setFilteredEvents(DEMO_EVENTS);
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

  const { toProfile } = useProfileNavigation();

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        <div className="events-page-intro">
          <div className="dashboard-title">Events</div>
          <div className="dashboard-subtitle">
            Browse and discover events on TickiSpot
          </div>
        </div>

        <div className="events-sticky-toolbar">
          <div className="events-toolbar-inner">
            <div className="search-wrapper events-toolbar-search">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search by title, location or category..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="dash-search"
              />
            </div>
            <div className="events-filter-row">
              <div className="events-filter-pills" role="toolbar" aria-label="Categories">
                {EVENT_FILTER_CHIPS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`events-filter-pill ${filterVisual === c.id ? "active" : ""}`}
                    onClick={() => setFilterVisual(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="events-sort">
                <label htmlFor="events-sort-select" className="events-sort-label">
                  Sort
                </label>
                <select
                  id="events-sort-select"
                  className="events-sort-select"
                  value={sortVisual}
                  onChange={(e) => setSortVisual(e.target.value)}
                  aria-label="Sort events"
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Most popular</option>
                  <option value="soonest">Starting soon</option>
                </select>
              </div>
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
        {!loading && (!error || useDemoData) && (
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
                    to={`/Eventdetail/${event._id}`}
                    key={eventRowKey(event)}
                    className="event-card"
                  >
                    {/* IMAGE */}
                    <div className="event-image-container">
                      {(() => {
                        const src = getEventImageSrc(event);
                        const key = eventRowKey(event);
                        const showPlaceholder = !src || brokenImages.has(key);
                        return showPlaceholder ? (
                          <div className="event-image event-image-placeholder-block" aria-hidden="true">
                            <div className="event-image-ph-shimmer" />
                            <img src={icon} alt="" className="event-image-ph-logo" />
                            <Ticket className="event-image-ph-icon" size={40} strokeWidth={1.25} />
                          </div>
                        ) : (
                          <img
                            src={src}
                            alt={event.title}
                            className="event-image"
                            onError={() => {
                              setBrokenImages((prev) => {
                                const next = new Set(prev);
                                next.add(key);
                                return next;
                              });
                            }}
                          />
                        );
                      })()}

                      <div className="event-image-badges">
                        <div className="event-image-badges-left">
                          {event?.category && (
                            <span className="event-category-badge">
                              {event.category}
                            </span>
                          )}
                        </div>
                        <div className="event-image-badges-right">
                          {event?.liveStream?.isLive && (
                            <span className="live-pill-floating">
                              <span className="live-dot pulse"></span>
                              LIVE
                            </span>
                          )}
                        </div>
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
                    <div
                      className="event-footer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toProfile(event.createdBy);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toProfile(event.createdBy);
                        }
                      }}
                    >
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