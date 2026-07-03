import { useEffect, useMemo, useRef, useState } from "react";
import API from "../api/axios";
import useProfileNavigation from "../hooks/useProfileNavigation";
import TickiAIChat from "../components/TickiAIChat";
import useFeatureAccess from "../hooks/useFeatureAccess";
import SEO from "../components/SEO";
import { Helmet } from "react-helmet-async";
import TrialNotificationBanner from "../components/TrialNotificationBanner";
import EventCard from "../components/EventCard";
import useDemoEvents from "../hooks/useDemoEvents";
import { useAuth } from "../context/AuthContext";

import {
  Music, Zap, Briefcase, UtensilsCrossed, Trophy, Globe,
  Search, AlertCircle, SearchX, Sparkles, X, SlidersHorizontal,
  ChevronLeft, ChevronRight, Calendar, MapPin, Ticket,
  TrendingUp, ArrowUpRight,
  ArrowLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const CHIPS = [
  { id: "all",      label: "All Events", icon: null             },
  { id: "music",    label: "Music",      icon: Music            },
  { id: "tech",     label: "Tech",       icon: Zap              },
  { id: "business", label: "Business",   icon: Briefcase        },
  { id: "food",     label: "Food",       icon: UtensilsCrossed  },
  { id: "sports",   label: "Sports",     icon: Trophy           },
  { id: "online",   label: "Online",     icon: Globe            },
];

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

// ─── Hero Slider ──────────────────────────────────────────────────────────────
function HeroSlider({ events }) {
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef(null);

  const featured = events.filter((e) => e.isFeatured || e.status === "approved").slice(0, 5);

  const prev = () => setIdx((i) => (i - 1 + featured.length) % featured.length);
  const next = () => setIdx((i) => (i + 1) % featured.length);

  useEffect(() => {
    if (hovered || featured.length === 0) return;
    timerRef.current = setInterval(next, 4800);
    return () => clearInterval(timerRef.current);
  }, [hovered, featured.length]);

  if (!featured.length) return null;

  const ev = featured[idx];
  const imageUrl = ev.image || ev.bannerImage || ev.coverImage || null;
  const price = !ev.price || ev.price === 0 ? "Free" : `₦${Number(ev.price).toLocaleString()}`;
  const date = ev.startDate || ev.date
    ? new Date(ev.startDate || ev.date).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })
    : "TBA";

  return (
    <section
      className="relative w-full h-[420px] sm:h-[500px] overflow-hidden rounded-2xl mb-10 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Slides */}
      {featured.map((e, i) => {
        const img = e.image || e.bannerImage || e.coverImage || null;
        return (
          <div
            key={e._id}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === idx ? 1 : 0, zIndex: i === idx ? 1 : 0 }}
          >
            {img ? (
              <img src={img} alt={e.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          </div>
        );
      })}

      {/* Content overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end p-7 sm:p-10">
        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 self-start mb-3 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[0.65rem] font-bold uppercase tracking-widest">
          <TrendingUp size={11} />
          Trending
        </span>

        <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight max-w-xl mb-2">
          {ev.title}
        </h2>

        {/* Hover-reveal: description + meta + CTA */}
        <div
          className="transition-all duration-500 overflow-hidden"
          style={{ maxHeight: hovered ? "160px" : "0px", opacity: hovered ? 1 : 0 }}
        >
          {ev.description && (
            <p className="text-white/75 text-sm mb-3 max-w-lg leading-relaxed line-clamp-2">
              {ev.description}
            </p>
          )}
          <div className="flex flex-wrap gap-4 mb-4">
            <span className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
              <Calendar size={12} className="text-pink-400" />
              {date}
            </span>
            {ev.location && (
              <span className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
                <MapPin size={12} className="text-pink-400" />
                {ev.location}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
              <Ticket size={12} className="text-pink-400" />
              {price}
            </span>
          </div>
          <button
            onClick={() => window.location.assign(`/event/${ev._id}`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold transition-all shadow-lg shadow-pink-500/30"
          >
            Get Tickets <ArrowUpRight size={15} />
          </button>
        </div>

        {/* Always-visible meta strip — hidden when hovered */}
        <div
          className="flex items-center gap-4 mt-3 transition-all duration-500"
          style={{ opacity: hovered ? 0 : 1, maxHeight: hovered ? "0px" : "40px", overflow: "hidden" }}
        >
          <span className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
            <Calendar size={12} className="text-pink-400" /> {date}
          </span>
          {ev.location && (
            <span className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
              <MapPin size={12} className="text-pink-400" /> {ev.location}
            </span>
          )}
        </div>
      </div>

      {/* Arrows — appear on group hover */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
        aria-label="Previous slide"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
        aria-label="Next slide"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === idx ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function SkelCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="aspect-[16/10] bg-slate-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 bg-slate-100 rounded" />
        <div className="h-3 w-1/2 bg-slate-100 rounded" />
        <div className="h-3 w-2/5 bg-slate-100 rounded" />
      </div>
      <div className="h-11 bg-slate-50 border-t border-slate-100" />
    </div>
  );
}

export default function Home() {
  const { hasAccess: canAI } = useFeatureAccess("tickiai");

  const [events, setEvents]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [useDemoData, setUseDemoData] = useState(false);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState("all");
  const [sort, setSort]               = useState("newest");
  const [showAI, setShowAI]           = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
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
        setEvents(data.filter((e) => e && e.createdBy));
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
    [demoEvents, events, useDemoData]
  );

  const filtered = useMemo(
    () => applyFilters(dataset, search, filter, sort),
    [dataset, search, filter, sort]
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    e.target.querySelector("input")?.blur();
  };

  return (
    <div className="min-h-full w-full bg-slate-50 font-geist">
      <TrialNotificationBanner />

      <SEO
        title="TickiSpot | Event Ticketing, Live Streaming & Analytics in Nigeria"
        description="TickiSpot is Nigeria's event ticketing and management platform."
        keywords="tickispot, event ticketing Nigeria, sell tickets Lagos"
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

      {/* ── HERO SEARCH BANNER ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Decorative pink glow */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[360px] h-[360px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-pink-500 transition-colors mb-6">
                  <ArrowLeft size={16} />
                  Back to Home
                </Link>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-pink-500 mb-3">
            Discover · Attend · Experience
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-2 leading-tight">
            Find your next event
          </h1>
          <p className="text-sm text-slate-500 mb-8 max-w-md">
            Music, tech, food, sports and more, all in one place.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl">
            <div className="relative flex items-center">
              <Search
                size={20}
                className="absolute left-5 text-slate-400 pointer-events-none z-10 flex-shrink-0"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events, locations, or categories…"
                className="w-full h-14 pl-13 pr-36 rounded-2xl bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                style={{ paddingLeft: "3rem" }}
              />
              <button
                type="submit"
                className="absolute right-2 h-10 px-5 rounded-xl bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/30 flex-shrink-0"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24">

        {/* ── Featured Hero Slider ── */}
        {!loading && dataset.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-pink-500" />
                <h2 className="text-base font-extrabold text-slate-900">For you</h2>
              </div>
            </div>
            <HeroSlider events={dataset} />
          </div>
        )}

        {/* ── Section header + filter row ── */}
        <div className="mb-6">
          <div className="flex items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">All Events</h2>
              {!loading && (
                <p className="text-xs text-slate-400 mt-0.5">
                  <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
                  event{filtered.length !== 1 ? "s" : ""} found
                  {useDemoData && (
                    <span className="ml-2 text-amber-500 font-semibold">(demo data)</span>
                  )}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-9 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none appearance-none cursor-pointer shadow-sm transition-all"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundPosition: "right 0.6rem center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <option value="newest">Newest first</option>
                  <option value="popular">Most popular</option>
                  <option value="soonest">Starting soon</option>
                </select>
              </div>

              {/* Filter toggle (mobile) */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`sm:hidden h-9 w-9 rounded-xl border flex items-center justify-center transition-all shadow-sm ${
                  showFilters
                    ? "bg-pink-500 border-pink-500 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                }`}
              >
                <SlidersHorizontal size={15} />
              </button>
            </div>
          </div>

          {/* Category chips */}
          <div className={`flex-wrap gap-2 ${showFilters ? "flex" : "hidden sm:flex"}`}>
            {CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setFilter(chip.id)}
                className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  filter === chip.id
                    ? "bg-slate-900 border-slate-900 text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-500 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50 shadow-sm"
                }`}
              >
                {chip.icon && <chip.icon size={13} />}
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active search badge */}
        {search && (
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs text-slate-500">
              Results for <strong className="text-slate-900">"{search}"</strong>
            </span>
            <button
              onClick={() => setSearch("")}
              className="inline-flex items-center gap-1 text-xs text-pink-500 hover:text-pink-700 font-semibold"
            >
              <X size={13} /> Clear
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkelCard key={i} />)}
          </div>
        )}

        {/* ── Hard error ── */}
        {!loading && error && !useDemoData && (
          <div className="py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-pink-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Couldn't load events</h3>
            <p className="text-sm text-slate-400 mb-5">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition-all shadow-md"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Content ── */}
        {!loading && (!error || useDemoData) && (
          <>
            {filtered.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <SearchX size={28} className="text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {search ? "No events match your search" : "No events yet"}
                </h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto mb-5">
                  {search
                    ? `Nothing found for "${search}". Try a different term.`
                    : "Check back soon — new events are added every day."}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-pink-500 text-white font-bold text-sm hover:bg-pink-600 transition-all shadow-md"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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

      {/* ── TickiAI Floating Button (desktop only) ── */}
      <div className="hidden md:block fixed bottom-6 right-6 z-[9999]">
        <div className="flex flex-col items-end gap-3">
          {showAI && (
            <div className="w-[380px] max-h-[calc(100vh-140px)] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
              <TickiAIChat />
            </div>
          )}
          <button
            onClick={() => {
              if (!user) { navigate("/login"); return; }
              setShowAI((v) => !v);
            }}
            className={`w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 ${
              showAI
                ? "bg-slate-900 rotate-90 shadow-slate-900/30"
                : "bg-gradient-to-br from-pink-500 to-pink-700 shadow-pink-500/30"
            }`}
            aria-label={showAI ? "Close TickiAI" : "Open TickiAI"}
          >
            {showAI ? <X size={22} /> : <Sparkles size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
}