import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import EmptyState from "../components/EmptyState";
import EventCard from "../components/EventCard";
import EventCardSkeleton from "../components/EventCardSkeleton";
import useDemoEvents from "../hooks/useDemoEvents";
import useProfileNavigation from "../hooks/useProfileNavigation";
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
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="aspect-[16/10] bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer rounded" />
        <div className="h-3 w-1/2 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer rounded" />
        <div className="h-3 w-2/5 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer rounded" />
      </div>
      <div className="h-11 bg-gray-50 border-t border-gray-100 flex items-center gap-2 px-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer" />
        <div className="h-3 w-20 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer rounded" />
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
    <div className="min-h-screen bg-gray-50 font-geist lg:pl-[var(--sidebar-width,0px)] pt-8">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <span className="inline-block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-pink-500 mb-2">
            Event infrastructure for serious teams
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 mb-2">
            Discover events
          </h1>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-lg">
            Browse social-first experiences across music, tech, culture, and community on TickiSpot.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center h-7 px-3 rounded-full border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-sm">
              50K+ active organizers
            </span>
            <span className="inline-flex items-center h-7 px-3 rounded-full border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-sm">
              500K+ tickets sold
            </span>
            <span className="inline-flex items-center h-7 px-3 rounded-full border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-sm">
              99.9% uptime
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-8 space-y-3">
          {/* Search */}
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              className="w-full h-12 pl-9 pr-12 rounded-full border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none shadow-sm"
              placeholder="Search events by title, location, or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-pink-500 text-white flex items-center justify-center transition-all duration-200 hover:bg-pink-600 hover:scale-105" aria-label="Search">
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5">
              {CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setFilter(chip.id)}
                  className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                    filter === chip.id
                      ? "bg-gray-900 border-gray-900 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-600 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50 shadow-sm"
                  }`}
                >
                  {chip.icon && <chip.icon size={14} />}
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-semibold text-gray-400">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-8 px-3 pr-8 rounded-full border-2 border-gray-200 bg-white text-gray-900 text-sm font-semibold transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none appearance-none bg-no-repeat"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundPosition: "right 0.7rem center",
                }}
              >
                <option value="newest">Newest</option>
                <option value="popular">Most loved</option>
                <option value="soonest">Starting soon</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-gray-400">
              <strong className="text-gray-900 font-bold">{filtered.length}</strong> event{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-20">
            {Array.from({ length: 8 }).map((_, i) => <SkelCard key={i} />)}
          </div>
        )}

        {/* Error State */}
        {error && !useDemoData && (
          <div className="col-span-full py-20 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle size={48} className="text-pink-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Couldn't load events</h3>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
        )}

        {/* Events Grid */}
        {!loading && (!error || useDemoData) && (
          <>
            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <div className="flex justify-center mb-4">
                  <SearchX size={56} strokeWidth={1.5} className="text-gray-300" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {search ? "No events match your search" : "No events yet"}
                </h3>
                <p className="text-sm text-gray-400 max-w-sm mx-auto mb-4">
                  {search
                    ? `We couldn't find anything for "${search}". Try a different term.`
                    : "Check back soon — new events are added every day."}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-pink-500 text-white font-bold text-sm transition-all duration-200 hover:bg-pink-600 shadow-md"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-20">
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

      {/* TickiAI Floating Button - Desktop Only */}
      <div className="hidden md:block fixed bottom-6 right-6 z-[9999]">
        <div className="flex flex-col items-end gap-3">
          {showAI && (
            <div className="w-[380px] max-h-[calc(100vh-140px)] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col animate-slide-up">
              <TickiAIChat />
            </div>
          )}
          <button
            onClick={() => setShowAI((v) => !v)}
            className={`w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 transition-all duration-300 hover:scale-110 ${
              showAI ? "rotate-90 bg-gray-900 from-gray-900 to-gray-800" : ""
            }`}
          >
            {showAI ? <X size={22} /> : <Sparkles size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
}