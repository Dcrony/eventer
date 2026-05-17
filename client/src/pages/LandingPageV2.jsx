import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import icon from "../assets/icon.svg";
import EventCard from "../components/EventCard";
import API from "../api/axios";
import { useCreateEvent } from "../context/CreateEventContext";
import { cn } from "../lib/utils";
import { getEventImageUrl } from "../utils/eventHelpers";

import {
  Ticket,
  Shield,
  BarChart3,
  Smartphone,
  Video,
  MessageSquare,
  ArrowRight,
  Calendar,
  Users,
  Search,
  Music,
  Laptop,
  Briefcase,
  GraduationCap,
  Globe,
  Mic2,
  Wrench,
  Facebook,
  Instagram,
  ChevronRight,
  ScanLine,
  Play,
  Radio,
  QrCode,
  Sparkles,
} from "lucide-react";

function XLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden={true}>
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}

function LiveBadge({ className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      Live
    </span>
  );
}

function StreamPreview({ coverUrl, title }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-pink-100 bg-gray-900 shadow-xl shadow-pink-500/10">
      <div className="relative aspect-video">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="h-full w-full object-cover opacity-90" />
        ) : (
          <div
            className="h-full w-full bg-gradient-to-br from-gray-800 via-gray-900 to-pink-950"
            aria-hidden
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <LiveBadge />
          <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
            1.2k watching
          </span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg shadow-pink-500/40">
            <Play size={24} className="ml-0.5" fill="currentColor" />
          </div>
        </div>
        <p className="absolute bottom-3 left-3 right-3 truncate text-sm font-semibold text-white">
          {title || "Your event stream"}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-gray-900/95 px-3 py-2.5">
        <span className="text-xs text-gray-400">HD · Low latency</span>
        <span className="rounded-md bg-pink-500/20 px-2 py-0.5 text-[10px] font-semibold text-pink-300">
          TickiSpot Stream
        </span>
      </div>
    </div>
  );
}

function TicketPreviewCard() {
  return (
    <div className="rounded-xl border border-pink-100 bg-white p-3 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-pink-500">
            Digital ticket
          </p>
          <p className="mt-0.5 text-sm font-bold text-gray-900">General Admission</p>
          <p className="text-xs text-gray-500">Sat, 8:00 PM · Lagos</p>
        </div>
        <QrCode size={36} className="shrink-0 text-pink-400" strokeWidth={1.5} />
      </div>
      <div className="mt-2 flex items-center justify-between rounded-lg bg-pink-50 px-2 py-1.5">
        <span className="text-xs font-medium text-gray-600">Status</span>
        <span className="text-xs font-bold text-pink-600">Valid · Scannable</span>
      </div>
    </div>
  );
}

const NAV_LINKS = [
  { to: "/events", label: "Explore events" },
  { to: "/pricing", label: "Pricing" },
  { to: "/features", label: "Features" },
];

const PILLARS = [
  {
    icon: Ticket,
    title: "Sell tickets",
    description: "Multi-tier pricing, instant checkout, and QR tickets attendees can use at the door.",
    accent: "from-pink-500 to-rose-500",
  },
  {
    icon: Video,
    title: "Stream live",
    description: "Broadcast concerts, conferences, and meetups — virtual, hybrid, or in-person.",
    accent: "from-rose-500 to-pink-600",
  },
  {
    icon: BarChart3,
    title: "Track everything",
    description: "Sales, attendance, stream viewers, and revenue in one organizer dashboard.",
    accent: "from-pink-600 to-fuchsia-500",
  },
];

const CAPABILITIES = [
  {
    icon: ScanLine,
    title: "QR check-in",
    description: "Scan tickets at entry — fast lines, fewer fraud issues.",
  },
  {
    icon: MessageSquare,
    title: "Audience chat",
    description: "Engage attendees before, during, and after the show.",
  },
  {
    icon: Shield,
    title: "Secure payments",
    description: "Trusted checkout with confirmations and refund controls.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    description: "Buy tickets and join streams from any device.",
  },
];

const METRICS = [
  { value: "10K+", label: "Events hosted" },
  { value: "500K+", label: "Tickets sold" },
  { value: "50K+", label: "Organizers" },
  { value: "99.9%", label: "Uptime" },
];

const WORKFLOW = [
  { step: "01", title: "Create your event", body: "Set details, ticket types, and stream settings." },
  { step: "02", title: "Sell & promote", body: "Share your page and watch sales roll in live." },
  { step: "03", title: "Go live", body: "Stream to your audience and scan tickets at the door." },
  { step: "04", title: "Measure impact", body: "Review analytics and plan your next event." },
];

export default function LandingPageV2() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { openCreateEvent } = useCreateEvent();

  const categories = [
    { id: "all", name: "All events", icon: Calendar },
    { id: "music", name: "Music", icon: Music },
    { id: "tech", name: "Tech", icon: Laptop },
    { id: "business", name: "Business", icon: Briefcase },
    { id: "campus", name: "Campus", icon: GraduationCap },
    { id: "online", name: "Online", icon: Globe },
    { id: "comedy", name: "Comedy", icon: Mic2 },
    { id: "workshop", name: "Workshop", icon: Wrench },
  ];

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await API.get("/events");
      const eventData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];
      setEvents(eventData);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const byCategory =
      selectedCategory === "all" || event.category?.toLowerCase() === selectedCategory;
    const bySearch =
      !searchQuery ||
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return byCategory && bySearch;
  });

  const trendingEvents = [...events]
    .sort((a, b) => (b.ticketsSold || 0) - (a.ticketsSold || 0))
    .slice(0, 6);

  const featuredEvents =
    selectedCategory === "all" ? trendingEvents : filteredEvents.slice(0, 6);

  const displayEvents = searchQuery ? filteredEvents : featuredEvents;

  const heroEvent = trendingEvents[0];
  const heroCover = heroEvent ? getEventImageUrl(heroEvent) : null;
  const heroTitle = heroEvent?.title;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/50 font-geist text-gray-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-pink-100/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={icon} className="h-8 w-8" alt="TickiSpot" />
            <span className="text-lg font-bold text-gray-900">
              Ticki<span className="text-pink-500">Spot</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-pink-500"
              >
                {item.label}
              </Link>
            ))}
            {isLoggedIn && (
              <Link
                to="/my-tickets"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-pink-500"
              >
                My tickets
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-pink-500/25 transition-colors hover:bg-pink-600"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-pink-200 hover:text-pink-500 sm:inline-block"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-pink-500/25 transition-colors hover:bg-pink-600"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:pb-24">
        <div
          className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-rose-100/50 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
              <Radio size={12} className="text-pink-500" />
              Events · Tickets · Live streaming
            </p>

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
              The event platform for{" "}
              <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                tickets & live streams
              </span>
            </h1>

            <p className="mt-4 max-w-lg text-base leading-relaxed text-gray-600 sm:text-lg">
              Sell tickets, host live shows, scan attendees at the door, and grow your audience — all
              on TickiSpot, built for organizers in Nigeria and beyond.
            </p>

            <div className="mt-6 flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-pink-100">
              <Search size={18} className="ml-2 shrink-0 text-gray-400" />
              <input
                type="search"
                placeholder="Search concerts, conferences, streams…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-500 text-white transition-colors hover:bg-pink-600"
                aria-label="Search"
              >
                <ArrowRight size={16} />
              </button>
            </div>

            {searchQuery && (
              <p className="mt-2 text-sm text-gray-500">
                {filteredEvents.length} result{filteredEvents.length !== 1 ? "s" : ""} for &ldquo;
                {searchQuery}&rdquo;
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={openCreateEvent}
                  className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-pink-500/25 transition-colors hover:bg-pink-600"
                >
                  Create event
                  <ArrowRight size={16} />
                </button>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-pink-500/25 transition-colors hover:bg-pink-600"
                >
                  Start free
                  <ArrowRight size={16} />
                </Link>
              )}
              <Link
                to="/events"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-pink-200 hover:text-pink-600"
              >
                Browse events
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {["In-person", "Virtual", "Hybrid", "QR check-in"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-pink-100 bg-white px-3 py-1 text-xs font-medium text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Product preview */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <StreamPreview coverUrl={heroCover} title={heroTitle} />
            <div className="absolute -bottom-4 -left-2 w-[55%] sm:-left-4">
              <TicketPreviewCard />
            </div>
            <div className="absolute -right-1 top-1/2 hidden -translate-y-1/2 rounded-xl border border-pink-100 bg-white px-3 py-2 shadow-lg sm:block">
              <p className="text-[10px] font-semibold text-gray-400">Tonight</p>
              <p className="text-sm font-bold text-pink-600">+248 tickets</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="relative mx-auto mt-14 grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {METRICS.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-pink-100/80 bg-white/80 px-4 py-4 text-center backdrop-blur-sm sm:py-5"
            >
              <p className="text-xl font-extrabold text-gray-900 sm:text-2xl">{metric.value}</p>
              <p className="mt-0.5 text-xs font-medium text-gray-500 sm:text-sm">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="border-y border-pink-100/80 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
              One platform for the full event lifecycle
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-500">
              From ticket sale to live broadcast to post-event analytics — built for music, tech,
              campus, and corporate events.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article
                  key={pillar.title}
                  className="group rounded-2xl border border-pink-100 bg-gradient-to-b from-white to-pink-50/30 p-6 transition-shadow hover:shadow-lg hover:shadow-pink-100/50"
                >
                  <div
                    className={cn(
                      "mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                      pillar.accent,
                    )}
                  >
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{pillar.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stream + ticketing spotlight */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="order-2 lg:order-1">
              <div className="overflow-hidden rounded-2xl border border-pink-100 shadow-xl shadow-pink-500/10">
                <StreamPreview
                  coverUrl={trendingEvents[1] ? getEventImageUrl(trendingEvents[1]) : heroCover}
                  title={trendingEvents[1]?.title || "Live on TickiSpot"}
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-sm font-bold uppercase tracking-wider text-pink-500">
                Live streaming
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                Broadcast to your audience wherever they are
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Run concerts, webinars, and launch parties with built-in streaming. Attendees with
                tickets join in one click — no extra apps or messy links.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "HD streams with live viewer counts",
                  "Chat and engagement during the show",
                  "Works alongside in-person ticket scanning",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm font-medium text-gray-700">
                    <Sparkles size={16} className="mt-0.5 shrink-0 text-pink-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/features"
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-pink-600 hover:text-pink-700"
              >
                See streaming features
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* More capabilities */}
      <section className="bg-pink-50/40 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Everything else you need on event day
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-xl border border-pink-100 bg-white p-5"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-pink-100">
                    <Icon size={18} className="text-pink-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-gray-600">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold text-gray-900 sm:text-3xl">
            From idea to encore in four steps
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW.map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-pink-100 bg-white p-5"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-500 text-sm font-bold text-white">
                  {item.step.replace("0", "")}
                </span>
                <h3 className="mt-4 font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="border-t border-pink-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-pink-500">
                Discover
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                {searchQuery
                  ? "Search results"
                  : selectedCategory === "all"
                    ? "Trending events"
                    : `${categories.find((c) => c.id === selectedCategory)?.name ?? ""}`}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Get tickets or join the live stream
              </p>
            </div>
            {!searchQuery && (
              <Link
                to="/events"
                className="inline-flex items-center gap-1 text-sm font-semibold text-pink-600 hover:text-pink-700"
              >
                View all events
                <ChevronRight size={16} />
              </Link>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row">
            {!searchQuery && (
              <aside className="lg:w-56 lg:shrink-0">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Categories
                </p>
                <div className="flex flex-wrap gap-1.5 lg:flex-col">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const active = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                          active
                            ? "bg-pink-500 text-white shadow-md shadow-pink-500/20"
                            : "text-gray-600 hover:bg-pink-50 hover:text-pink-600",
                        )}
                      >
                        <Icon size={14} />
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </aside>
            )}

            <div className="min-w-0 flex-1">
              {loading ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className="overflow-hidden rounded-xl border border-pink-100 bg-pink-50/30"
                    >
                      <div className="h-36 animate-pulse bg-pink-100/50" />
                      <div className="space-y-2 p-4">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-pink-100" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-pink-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayEvents.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {displayEvents.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-pink-200 bg-pink-50/50 px-6 py-16 text-center">
                  <Calendar size={32} className="mx-auto text-pink-300" />
                  <p className="mt-4 text-gray-600">No events in this category yet.</p>
                  {isLoggedIn && (
                    <button
                      type="button"
                      onClick={openCreateEvent}
                      className="mt-5 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-600"
                    >
                      Create the first one
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-pink-500 to-rose-600 p-8 text-center text-white shadow-xl shadow-pink-500/30 sm:p-12">
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            Ready to sell tickets and go live?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-pink-100">
            Join organizers using TickiSpot for in-person shows, virtual events, and hybrid
            experiences.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={openCreateEvent}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-pink-600 shadow-md transition-colors hover:bg-pink-50"
              >
                Create event
                <ArrowRight size={16} />
              </button>
            ) : (
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-pink-600 shadow-md transition-colors hover:bg-pink-50"
              >
                Get started free
                <ArrowRight size={16} />
              </Link>
            )}
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-5 text-xs text-pink-200">
            14-day Pro trial · No credit card to start
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900 py-12 text-gray-400">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Link to="/" className="inline-flex items-center gap-2">
                <img src={icon} className="h-8 w-8" alt="" />
                <span className="font-bold text-white">
                  Ticki<span className="text-pink-400">Spot</span>
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed">
                Event ticketing, live streaming, and analytics — one home for your shows,
                conferences, and communities.
              </p>
              <div className="mt-4 flex gap-2">
                <a
                  href="https://x.com/tickispot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 transition-colors hover:border-pink-500 hover:text-pink-400"
                  aria-label="X"
                >
                  <XLogo size={15} />
                </a>
                <a
                  href="https://www.facebook.com/share/1ArixBJeTq/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 transition-colors hover:border-pink-500 hover:text-pink-400"
                  aria-label="Facebook"
                >
                  <Facebook size={16} />
                </a>
                <a
                  href="https://www.instagram.com/tickispot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 transition-colors hover:border-pink-500 hover:text-pink-400"
                  aria-label="Instagram"
                >
                  <Instagram size={16} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white">Product</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link to="/events" className="hover:text-pink-400">
                    Events
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-pink-400">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="hover:text-pink-400">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/docs" className="hover:text-pink-400">
                    Docs
                  </Link>
                </li>
                <li>
                  {isLoggedIn ? (
                    <button type="button" onClick={openCreateEvent} className="hover:text-pink-400">
                      Create event
                    </button>
                  ) : (
                    <Link to="/register" className="hover:text-pink-400">
                      Create event
                    </Link>
                  )}
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white">Company</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link to="/about" className="hover:text-pink-400">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-pink-400">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/help" className="hover:text-pink-400">
                    Help center
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-pink-400">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/donation" className="hover:text-pink-400">
                    Support us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white">Legal</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link to="/privacy" className="hover:text-pink-400">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-pink-400">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-800 pt-6 text-center text-xs">
            <p>© {new Date().getFullYear()} TickiSpot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
