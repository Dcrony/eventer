import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import API from "../api/axios";
import EmptyState from "../components/EmptyState";
import EventCard from "../components/EventCard";
import EventCardSkeleton from "../components/EventCardSkeleton";
import useDemoEvents from "../hooks/useDemoEvents";
import useProfileNavigation from "../hooks/useProfileNavigation";
import "./CSS/home.css";
import SEO from "../public/SEO"

const EVENT_FILTER_CHIPS = [
  { id: "all", label: "All" },
  { id: "music", label: "Music" },
  { id: "tech", label: "Tech" },
  { id: "business", label: "Business" },
  { id: "food", label: "Food" },
  { id: "sports", label: "Sports" },
  { id: "online", label: "Online" },
];

const applyFilters = (items, searchTerm, filter, sortBy) => {
  const lowerSearch = searchTerm.trim().toLowerCase();

  let nextItems = [...items].filter((event) => {
    const matchesSearch =
      !lowerSearch ||
      event?.title?.toLowerCase().includes(lowerSearch) ||
      event?.location?.toLowerCase().includes(lowerSearch) ||
      event?.category?.toLowerCase().includes(lowerSearch);

    const matchesFilter =
      filter === "all" ||
      event?.category?.toLowerCase() === filter ||
      (filter === "online" && !event?.location);

    return matchesSearch && matchesFilter;
  });

  nextItems.sort((left, right) => {
    if (sortBy === "popular") {
      return (right.likeCount || right.ticketsSold || 0) - (left.likeCount || left.ticketsSold || 0);
    }

    if (sortBy === "soonest") {
      return new Date(left.startDate || left.date || 0) - new Date(right.startDate || right.date || 0);
    }

    return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
  });

  return nextItems;
};

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [useDemoData, setUseDemoData] = useState(false);
  const [filterVisual, setFilterVisual] = useState("all");
  const [sortVisual, setSortVisual] = useState("newest");
  const { toProfile } = useProfileNavigation();

  const demoEvents = useDemoEvents(events, error && !useDemoData);

<SEO
  title={`${event.title} | Buy Tickets on TickiSpot`}
  description={event.description}
  url={`https://tickispot.com/events/${event.slug}`}
/>

<script type="application/ld+json">
{JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Event",
  "name": event.title,
  "startDate": event.date,
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "eventStatus": "https://schema.org/EventScheduled",
  "location": {
    "@type": "Place",
    "name": event.venue,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Lagos",
      "addressCountry": "NG"
    }
  },
  "image": [event.image],
  "description": event.description,
  "offers": {
    "@type": "Offer",
    "url": `https://tickispot.com/events/${event.slug}`,
    "price": event.price,
    "priceCurrency": "NGN",
    "availability": "https://schema.org/InStock"
  }
})}
</script>

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await API.get("/events");
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        setEvents(data);
        setUseDemoData(false);
        setError(null);
      } catch (fetchError) {
        console.error("Failed to load events:", fetchError);
        setError("Failed to load live events. Showing demo events instead.");
        setUseDemoData(true);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const dataset = useMemo(
    () => (useDemoData && demoEvents.length ? demoEvents : events),
    [demoEvents, events, useDemoData],
  );

  const filteredEvents = useMemo(
    () => applyFilters(dataset, searchTerm, filterVisual, sortVisual),
    [dataset, filterVisual, searchTerm, sortVisual],
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="events-page-intro">
          <div className="dashboard-title">Discover events</div>
          <div className="dashboard-subtitle">
            Browse social-first experiences across music, tech, culture, and community on
            TickiSpot.
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
                onChange={(event) => setSearchTerm(event.target.value)}
                className="dash-search"
              />
            </div>

            <div className="events-filter-row">
              <div className="events-filter-pills" role="toolbar" aria-label="Categories">
                {EVENT_FILTER_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    className={`events-filter-pill ${filterVisual === chip.id ? "active" : ""}`}
                    onClick={() => setFilterVisual(chip.id)}
                  >
                    {chip.label}
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
                  onChange={(event) => setSortVisual(event.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Most loved</option>
                  <option value="soonest">Starting soon</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="events-grid" role="status" aria-label="Loading events">
            {Array.from({ length: 6 }).map((_, idx) => (
              <EventCardSkeleton key={`event-skeleton-${idx}`} />
            ))}
          </div>
        ) : null}

        {error && !useDemoData ? (
          <div className="dash-card">
            <div className="dash-card-body center">
              <p className="error-text">{error}</p>
            </div>
          </div>
        ) : null}

        {!loading && (!error || useDemoData) ? (
          <>
            {filteredEvents.length === 0 ? (
              <EmptyState
                type={searchTerm ? "no-search-results" : "no-events"}
                searchTerm={searchTerm}
              />
            ) : (
              <div className="events-grid">
                {filteredEvents.map((event) => (
                  <EventCard key={event._id || event.title} event={event} onOrganizerClick={toProfile} />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
