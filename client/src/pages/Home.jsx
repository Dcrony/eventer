import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import EmptyState from "../components/EmptyState";
import EventCard from "../components/EventCard";
import EventCardSkeleton from "../components/EventCardSkeleton";
import useDemoEvents from "../hooks/useDemoEvents";
import useProfileNavigation from "../hooks/useProfileNavigation";
import "./CSS/home.css";
import TickiAIChat from "../components/TickiAIChat";
import useFeatureAccess from "../hooks/useFeatureAccess";
import SEO from "../components/SEO";
import { Helmet } from "react-helmet-async";
import TrialNotificationBanner from "../components/TrialNotificationBanner";

/* ── Icons ── */
import {
  Music,
  Zap,
  Briefcase,
  UtensilsCrossed,
  Trophy,
  Globe,
  Search,
  ArrowRight,
  AlertCircle,
  SearchX,
  Sparkles,
  X
} from "lucide-react";

/* ── Filter chips ── */
const CHIPS = [
  { id: "all", label: "All", icon: null },
  { id: "music", label: "Music", icon: Music },
  { id: "tech", label: "Tech", icon: Zap },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "food", label: "Food", icon: UtensilsCrossed },
  { id: "sports", label: "Sports", icon: Trophy },
  { id: "online", label: "Online", icon: Globe },
];

/* ── Filtering / sorting ── */
const applyFilters = (items, search, filter, sort) => {
  const q = search.trim().toLowerCase();
  let out = items.filter((e) => {
    const matchQ =
      !q ||
      e?.title?.toLowerCase().includes(q) ||
      e?.location?.toLowerCase().includes(q) ||
      e?.category?.toLowerCase().includes(q);
    const matchF =
      filter === "all" ||
      e?.category?.toLowerCase() === filter ||
      (filter === "online" && !e?.location);
    return matchQ && matchF;
  });
  out.sort((a, b) => {
    if (sort === "popular")
      return (b.likeCount || b.ticketsSold || 0) - (a.likeCount || a.ticketsSold || 0);
    if (sort === "soonest")
      return new Date(a.startDate || a.date || 0) - new Date(b.startDate || b.date || 0);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
  return out;
};

/* ── Skeleton card ── */
function SkelCard() {
  return (
    <div className="ts-skel-card">
      <div className="ts-skel-img" />
      <div className="ts-skel-body">
        <div className="ts-skel-line" style={{ height: 16, width: "75%" }} />
        <div className="ts-skel-line" style={{ height: 12, width: "55%" }} />
        <div className="ts-skel-line" style={{ height: 12, width: "40%" }} />
      </div>
      <div className="ts-skel-footer">
        <div className="ts-skel-line" style={{ width: 28, height: 28, borderRadius: 8 }} />
        <div className="ts-skel-line" style={{ width: 80, height: 12 }} />
      </div>
    </div>
  );
}

export default function Home() {
  const { hasAccess: canAI, promptUpgrade: promptAI } = useFeatureAccess("tickiai");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useDemoData, setUseDemoData] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [showAI, setShowAI] = useState(false);

  const { toProfile } = useProfileNavigation();
  const demoEvents = useDemoEvents(events, error && !useDemoData);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await API.get("/events");
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
        const sanitizedEvents = data.filter(
          (event) => event && event.createdBy
        );

        setEvents(sanitizedEvents);
        setUseDemoData(false);
        setError(null);
      } catch {
        setError("Failed to load live events. Showing demo events instead.");
        setUseDemoData(true);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dataset = useMemo(
    () => (useDemoData && demoEvents.length ? demoEvents : events),
    [demoEvents, events, useDemoData],
  );

  const filtered = useMemo(
    () => applyFilters(dataset, search, filter, sort),
    [dataset, search, filter, sort],
  );

  return (
    <div className=" dashboard-page">
      <TrialNotificationBanner />

      <SEO
        title="TickiSpot | Event Ticketing, Live Streaming & Analytics in Nigeria"
        description="TickiSpot is Nigeria’s event ticketing and management platform for Lagos and nationwide events. Sell tickets, manage attendees, host live streams, and view analytics in one dashboard."
        keywords="tickispot, event ticketing platform Nigeria, sell tickets Lagos, live streaming events Nigeria, event management platform Africa, ticketing analytics dashboard"
        url="https://tickispot.com"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: filtered.slice(0, 10).map((e, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `https://tickispot.com/event/${e._id || e.id}`,
            })),
          })}
        </script>
      </Helmet>

      <div className="ts-home-container">
        <div className="ts-intro">
          <span className="ts-intro-eyebrow">Event infrastructure for serious teams</span>
          <h1 className="ts-intro-title">Discover events</h1>
          <p className="ts-intro-sub">
            Browse social-first experiences across music, tech, culture, and community on TickiSpot.
          </p>
          <div className="ts-stat-pills">
            <span className="ts-stat-pill">50K+ active organizers</span>
            <span className="ts-stat-pill">500K+ tickets sold</span>
            <span className="ts-stat-pill">99.9% uptime</span>
          </div>
        </div>

        <div className="ts-toolbar">
          <div className="ts-search-wrap">
            <span className="ts-search-ico"><Search size={18} /></span>
            <input
              type="search"
              className="ts-search-input"
              placeholder="Search events by title, location, or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="ts-search-submit" aria-label="Search">
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="ts-filter-row">
            <div className="ts-pills" role="toolbar" aria-label="Categories">
              {CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  className={`ts-pill ${filter === chip.id ? "active" : ""}`}
                  onClick={() => setFilter(chip.id)}
                >
                  {chip.icon && <chip.icon size={14} className="ts-chip-icon" />}
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="ts-sort-wrap">
              <span className="ts-sort-label">Sort</span>
              <select
                className="ts-sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="popular">Most loved</option>
                <option value="soonest">Starting soon</option>
              </select>
            </div>
          </div>
        </div>

        {!loading && (
          <div className="ts-results-bar">
            <p className="ts-results-count">
              <strong>{filtered.length}</strong> event{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
        )}

        {loading && (
          <div className="ts-skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkelCard key={i} />)}
          </div>
        )}

        {error && !useDemoData && (
          <div className="ts-empty" style={{ gridColumn: "1/-1" }}>
            <div className="ts-empty-icon"><AlertCircle size={40} color="var(--ts-pink)" /></div>
            <h3>Couldn't load events</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && (!error || useDemoData) && (
          <>
            {filtered.length === 0 ? (
              <div className="ts-events-grid">
                <div className="ts-empty">
                  <div className="ts-empty-icon"><SearchX size={48} strokeWidth={1.5} /></div>
                  <h3>{search ? "No events match your search" : "No events yet"}</h3>
                  <p>
                    {search
                      ? `We couldn't find anything for "${search}". Try a different term.`
                      : "Check back soon — new events are added every day."}
                  </p>
                  {search && (
                    <button className="ts-empty-cta" onClick={() => setSearch("")}>
                      Clear search
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="ts-events-grid">
                {filtered.map((event) => (
                  <EventCard
                    key={event._id || event.title}
                    event={event}
                    onOrganizerClick={toProfile}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="ts-desktop-ai-only">
        <div className="ts-ai-wrapper">
          {showAI && (
            <div className="ts-ai-modal">
              <TickiAIChat />
            </div>
          )}
          <button
            className={`ts-ai-btn ${showAI ? "open" : ""}`}
            onClick={() => setShowAI((v) => !v)}
          >
            {showAI ? <X size={20} /> : <Sparkles size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}