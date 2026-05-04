import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Play,
  MapPin,
  Search,
  Video,
  Radio,
  Sparkles,
  X,
  ChevronDown,
  RotateCw,
  Settings,
} from "lucide-react";
import useProfileNavigation from "../hooks/useProfileNavigation";
import API from "../api/axios";
import GoLiveModal from "./GoLiveModal";
import { getEventImageUrl, getProfileImageUrl } from "../utils/eventHelpers";
import Avatar from "./ui/avatar";
import "./css/LiveEvents.css";
import usePlanAccess from "../hooks/usePlanAccess";
import { promptUpgrade } from "../utils/planAccess";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const PORT_URL = API_URL.replace(/\/api\/?$/, "");

const SORT_OPTIONS = [
  { value: "recent", label: "Recently live" },
  { value: "viewers", label: "Most viewers" },
  { value: "title", label: "Title A–Z" },
];

function getViewerCount(event) {
  return typeof event.liveStream?.viewerCount === "number"
    ? event.liveStream.viewerCount
    : 0;
}

export default function LiveEvent() {
  const canAccessLiveStreaming = usePlanAccess("live_stream");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [isGoLiveOpen, setIsGoLiveOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const goLiveBtnRef = useRef(null);
  const sortWrapRef = useRef(null);
  const navigate = useNavigate();
  const { toProfile } = useProfileNavigation();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortWrapRef.current && !sortWrapRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    };
    if (sortDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [sortDropdownOpen]);

  const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("user");
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const currentUserId = user?.id || user?._id;

  const fetchEvents = useCallback(() => {
    setError(null);
    setLoading(true);
    const url = "/events?liveOnly=true";
    API.get(url)
      .then((res) => {
        setEvents(res.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load live streams. Please try again.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        API.get("/events?liveOnly=true")
          .then((res) => setEvents(res.data || []))
          .catch(() => {});
      }
    }, 50000);
    return () => clearInterval(interval);
  }, []);

  const myLiveEvent = useMemo(() => {
    if (!currentUserId || !events?.length) return null;
    return events.find(
      (e) => {
        const ownerId =
          typeof e.createdBy === "string"
            ? e.createdBy
            : e.createdBy?._id || e.createdBy?.id;
        return e.liveStream?.isLive && ownerId === currentUserId;
      }
    ) || null;
  }, [currentUserId, events]);

  const liveEventsBase = useMemo(() => {
    return (events || []).filter(
      (e) =>
        e.liveStream?.isLive &&
        (e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.createdBy?.username?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [events, searchQuery]);

  const categories = useMemo(() => {
    const set = new Set();
    liveEventsBase.forEach((e) => e.category && set.add(e.category));
    return Array.from(set).sort();
  }, [liveEventsBase]);

  const locations = useMemo(() => {
    const set = new Set();
    liveEventsBase.forEach((e) => e.location && set.add(e.location));
    return Array.from(set).sort();
  }, [liveEventsBase]);

  const liveEvents = useMemo(() => {
    let list = liveEventsBase.filter((e) => {
      if (categoryFilter && e.category !== categoryFilter) return false;
      if (locationFilter && e.location !== locationFilter) return false;
      return true;
    });
    if (sortBy === "viewers") {
      list = [...list].sort((a, b) => getViewerCount(b) - getViewerCount(a));
    } else if (sortBy === "title") {
      list = [...list].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else {
      list = [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return list;
  }, [liveEventsBase, categoryFilter, locationFilter, sortBy]);

  const isSearchEmpty = searchQuery.trim() !== "" && liveEvents.length === 0 && !loading && !error;
  const isGenericEmpty = !loading && !error && liveEvents.length === 0 && searchQuery.trim() === "" && !categoryFilter && !locationFilter;

  return (
    <div className="live-page">
      <div className="live-page-bg" aria-hidden="true" />
      <div className="live-container">
        <header className="live-header">
          <div className="live-header-text">
            <h1 className="live-title">
              <span className="live-title-dot" aria-hidden="true" />
              Live Now
            </h1>
            <p className="live-subtitle">
              <span className="live-count" aria-live="polite">
                {!loading && !error && liveEvents.length > 0
                  ? `${liveEvents.length} stream${liveEvents.length === 1 ? "" : "s"} live now`
                  : "Watch streams in real time and connect with organizers"}
              </span>
            </p>
          </div>
          <div className="live-header-actions">
            <div className="live-search-wrap">
              <Search className="live-search-icon" size={18} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search live streams..."
                className="live-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search live streams"
              />
            </div>
            <div className="live-sort-wrap" ref={sortWrapRef}>
              <button
                type="button"
                className="live-sort-btn"
                onClick={() => setSortDropdownOpen((o) => !o)}
                aria-expanded={sortDropdownOpen}
                aria-haspopup="listbox"
                aria-label="Sort by"
              >
                {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Sort"}
                <ChevronDown size={16} />
              </button>
              {sortDropdownOpen && (
                <ul
                  className="live-sort-dropdown"
                  role="listbox"
                  aria-label="Sort options"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={sortBy === opt.value}
                      className="live-sort-option"
                      onClick={() => {
                        setSortBy(opt.value);
                        setSortDropdownOpen(false);
                      }}
                    >
                      {opt.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {isLoggedIn && (
              <button
                ref={goLiveBtnRef}
                type="button"
                className="live-go-live-btn"
                onClick={() => {
                  if (!canAccessLiveStreaming) {
                    promptUpgrade("live streaming");
                    return;
                  }
                  setIsGoLiveOpen(true);
                }}
              >
                <Video size={18} />
                Go Live
              </button>
            )}
          </div>
        </header>

        {(categories.length > 0 || locations.length > 0) && !loading && !error && (
          <div className="live-filters">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`live-filter-chip ${categoryFilter === cat ? "active" : ""}`}
                onClick={() => setCategoryFilter((c) => (c === cat ? "" : cat))}
              >
                {cat}
              </button>
            ))}
            {locations.map((loc) => (
              <button
                key={loc}
                type="button"
                className={`live-filter-chip ${locationFilter === loc ? "active" : ""}`}
                onClick={() => setLocationFilter((l) => (l === loc ? "" : loc))}
              >
                <MapPin size={12} />
                {loc}
              </button>
            ))}
          </div>
        )}

        {myLiveEvent && (
          <div className="live-organizer-entry">
            <div className="live-organizer-entry-inner">
              <span className="live-organizer-entry-badge">
                <Radio size={16} />
                You&apos;re live
              </span>
              <h2 className="live-organizer-entry-title">{myLiveEvent.title}</h2>
              <button
                type="button"
                className="live-organizer-entry-btn"
                onClick={() => navigate(`/live/${myLiveEvent._id}`)}
              >
                <Settings size={18} />
                Manage stream
              </button>
            </div>
          </div>
        )}

        <section className="live-content" aria-busy={loading} aria-live="polite">
          {error && (
            <div className="live-error">
              <p className="live-error-text">{error}</p>
              <button type="button" className="live-retry-btn" onClick={fetchEvents}>
                <RotateCw size={18} />
                Retry
              </button>
            </div>
          )}

          {loading && !error && (
            <div className="live-loading live-loading-skeletons">
              <div className="live-grid live-skeleton-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="live-card-skeleton" aria-hidden="true">
                    <div className="live-skeleton-thumb" />
                    <div className="live-skeleton-body">
                      <div className="live-skeleton-avatar" />
                      <div className="live-skeleton-lines">
                        <div className="live-skeleton-line wide" />
                        <div className="live-skeleton-line" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !error && isSearchEmpty && (
            <div className="live-empty live-empty-search">
              <div className="live-empty-icon">
                <Search size={40} strokeWidth={1.5} />
              </div>
              <h2 className="live-empty-title">No streams match &ldquo;{searchQuery}&rdquo;</h2>
              <p className="live-empty-subtitle">Try a different search or clear filters.</p>
              <button
                type="button"
                className="live-empty-cta live-empty-cta-secondary"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("");
                  setLocationFilter("");
                }}
              >
                <X size={18} />
                Clear search
              </button>
            </div>
          )}

          {!loading && !error && isGenericEmpty && (
            <div className="live-empty">
              <div className="live-empty-icon">
                <Radio size={40} strokeWidth={1.5} />
              </div>
              <h2 className="live-empty-title">No live streams right now</h2>
              <p className="live-empty-subtitle">Be the first to go live or check back soon.</p>
              {isLoggedIn && (
                <button
                  type="button"
                  className="live-empty-cta"
                  onClick={() => {
                    if (!canAccessLiveStreaming) {
                      promptUpgrade("live streaming");
                      return;
                    }
                    setIsGoLiveOpen(true);
                  }}
                >
                  <Sparkles size={18} />
                  Go Live
                </button>
              )}
            </div>
          )}

          {!loading && !error && liveEvents.length > 0 && (
            <div className="live-grid">
              {liveEvents.map((event) => (
                <article
                  key={event._id}
                  className="live-card"
                  onClick={() => navigate(`/live/${event._id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/live/${event._id}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Watch ${event.title} by ${event.createdBy?.username || "Organizer"}`}
                >
                  <div className="live-card-thumb">
                    {getEventImageUrl(event) ? (
                      <img
                        src={getEventImageUrl(event)}
                        alt={event.title || "Event thumbnail"}
                        className="live-card-thumb-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="live-card-thumb-placeholder">
                        <Play size={36} strokeWidth={2} />
                      </div>
                    )}
                    <span className="live-card-badge">LIVE</span>
                    <span className="live-card-viewers">
                      <Users size={12} />
                      {typeof event.liveStream?.viewerCount === "number"
                        ? event.liveStream.viewerCount
                        : "—"}
                    </span>
                  </div>
                  <div className="live-card-body">
                    <div
                      className="live-card-author"
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
                      <Avatar
                        src={getProfileImageUrl(event.createdBy)}
                        name={event.createdBy?.username || event.createdBy?.name || "Organizer"}
                        className="live-card-avatar"
                        alt=""
                      />
                      <div className="live-card-info">
                        <h3 className="live-card-title">{event.title}</h3>
                        <p className="live-card-creator">
                          {event.createdBy?.username || "Organizer"}
                        </p>
                        <div className="live-card-meta">
                          {event.category && (
                            <span className="live-card-category">{event.category}</span>
                          )}
                          {event.location && (
                            <span className="live-card-location">
                              <MapPin size={10} />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <GoLiveModal
        isOpen={isGoLiveOpen}
        onClose={() => {
          setIsGoLiveOpen(false);
          goLiveBtnRef.current?.focus();
        }}
        onStreamStarted={(eventId) => navigate(`/live/${eventId}`)}
        focusReturnRef={goLiveBtnRef}
      />
    </div>
  );
}
