import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
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
  Zap,
  Star,
  CheckCircle2,
  TrendingUp,
  Lock,
  Menu,
  X,
} from "lucide-react";

function XLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const NAV_LINKS = [
  { to: "/events",   label: "Explore" },
  { to: "/pricing",  label: "Pricing" },
  { to: "/features", label: "Features" },
];

const FEATURES = [
  {
    icon: Ticket,
    title: "Smart ticketing",
    desc: "Multi-tier pricing, instant checkout, and scannable QR tickets , free or paid.",
  },
  {
    icon: Radio,
    title: "Built-in livestream",
    desc: "Broadcast your event to any device. Virtual, hybrid, or in-person, same platform.",
  },
  {
    icon: BarChart3,
    title: "Revenue analytics",
    desc: "Real-time dashboards for sales, attendance, and stream viewers in one place.",
  },
  {
    icon: ScanLine,
    title: "Door QR scanner",
    desc: "Scan tickets at entry in seconds. No extra hardware or third-party apps.",
  },
  {
    icon: MessageSquare,
    title: "Audience engagement",
    desc: "Live chat, Q&A, and post-event messaging to keep your community active.",
  },
  {
    icon: Shield,
    title: "Secure payouts",
    desc: "Funds land in your account after events close. Full refund and chargeback controls.",
  },
];

const STEPS = [
  { n: "1", title: "Create your event", body: "Set ticket types, pricing, stream settings, and go live in minutes." },
  { n: "2", title: "Sell and promote", body: "Share your event page and track sales in real time from your dashboard." },
  { n: "3", title: "Stream or scan", body: "Go live to virtual attendees while scanning tickets at the door." },
  { n: "4", title: "Measure and grow", body: "See exactly what worked , ticket sales, viewer counts, revenue breakdown." },
];

const SOCIAL_PROOF = [
  { quote: "TickiSpot made our sold-out Lagos concert genuinely effortless to run.", name: "Adaeze O.", role: "Concert promoter" },
  { quote: "We sold 2,000 tickets for our tech summit and streamed to 800 online , all from one dashboard.", name: "Taiwo B.", role: "Conference organizer" },
  { quote: "The QR scanner saved us 40 minutes at the door. Attendees were through in seconds.", name: "Chidi M.", role: "Campus event lead" },
];

const CATEGORIES = [
  { id: "all",      name: "All events",  icon: Calendar    },
  { id: "music",    name: "Music",       icon: Music       },
  { id: "tech",     name: "Tech",        icon: Laptop      },
  { id: "business", name: "Business",    icon: Briefcase   },
  { id: "campus",   name: "Campus",      icon: GraduationCap },
  { id: "online",   name: "Online",      icon: Globe       },
  { id: "comedy",   name: "Comedy",      icon: Mic2        },
  { id: "workshop", name: "Workshop",    icon: Wrench      },
];

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn]         = useState(false);
  const [events, setEvents]                 = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery]       = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openCreateEvent } = useCreateEvent();

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
    (async () => {
      try {
        setLoading(true);
        const res  = await API.get("/events");
        const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
        setEvents(data);
      } catch { setEvents([]); } finally { setLoading(false); }
    })();
  }, []);

  const filtered = events.filter((e) => {
    const cat = selectedCategory === "all" || e.category?.toLowerCase() === selectedCategory;
    const q   = !searchQuery || [e.title, e.description, e.location].some((s) => s?.toLowerCase().includes(searchQuery.toLowerCase()));
    return cat && q;
  });

  const trending = [...events].sort((a, b) => (b.ticketsSold || 0) - (a.ticketsSold || 0)).slice(0, 6);
  const display  = searchQuery ? filtered : (selectedCategory === "all" ? trending : filtered.slice(0, 6));

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={icon} className="h-8 w-8" alt="TickiSpot" />
            <span className="text-[1.1rem] font-black tracking-tight text-gray-900">
              Ticki<span className="text-pink-500">Spot</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((item) => (
              <Link key={item.to} to={item.to}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
                {item.label}
              </Link>
            ))}
            {isLoggedIn && (
              <Link to="/my-tickets"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
                My tickets
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2.5">
            {isLoggedIn ? (
              <Link to="/dashboard"
                className="rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-500/30 transition-all hover:bg-pink-600 hover:-translate-y-0.5">
                Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login"
                  className="hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900 sm:block">
                  Sign in
                </Link>
                <Link to="/register"
                  className="rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-500/30 transition-all hover:bg-pink-600 hover:-translate-y-0.5">
                  Get started
                </Link>
              </>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 md:hidden">
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-100 bg-white px-5 py-4 md:hidden">
            {NAV_LINKS.map((item) => (
              <Link key={item.to} to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20">
        {/* Background pattern */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-pink-50 opacity-60" />
          <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-rose-50 opacity-40" />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #be185d 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl">
          {/* Eyebrow badge */}
          <div className="mb-8 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-pink-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500" />
              </span>
              Nigeria's event platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-4xl text-center text-[2.5rem] font-black leading-[1.05] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Sell tickets.{" "}
            <span className="relative">
              <span className="relative z-10 text-pink-500">Stream live.</span>
              <svg className="absolute -bottom-1 left-0 right-0 z-0 w-full" viewBox="0 0 400 12" fill="none" aria-hidden>
                <path d="M2 9 Q200 2 398 9" stroke="#fce7f3" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </span>{" "}
            Grow your{" "}
            <br className="hidden sm:block" />
            audience.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-center text-lg leading-relaxed text-gray-500 sm:text-xl">
            TickiSpot handles ticketing, live streaming, door scanning, and analytics , so you can
            focus on the show. Built for organisers across Nigeria and Africa.
          </p>

          {/* Search */}
          <div className="mx-auto mt-10 max-w-xl">
            <div className="flex items-center gap-2 rounded-2xl border-2 border-gray-100 bg-gray-50 p-2 transition-all focus-within:border-pink-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-pink-50">
              <Search size={18} className="ml-2 shrink-0 text-gray-400" />
              <input
                type="search"
                placeholder="Search concerts, conferences, workshops…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
              <button type="button"
                className="shrink-0 rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-500/30">
                Search
              </button>
            </div>
            {searchQuery && (
              <p className="mt-2 text-center text-sm text-gray-400">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{searchQuery}"
              </p>
            )}
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isLoggedIn ? (
              <button onClick={openCreateEvent}
                className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-pink-500/30 transition-all hover:bg-pink-600 hover:-translate-y-0.5">
                Create an event
                <ArrowRight size={18} />
              </button>
            ) : (
              <Link to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-pink-500/30 transition-all hover:bg-pink-600 hover:-translate-y-0.5">
                Start for free
                <ArrowRight size={18} />
              </Link>
            )}
            <Link to="/events"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-7 py-3.5 text-base font-bold text-gray-700 transition-all hover:border-pink-200 hover:text-pink-600">
              Browse events
            </Link>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            Free to start · No credit card required · 14-day Pro trial
          </p>

          {/* Hero visual , dashboard mockup */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/80">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-5 py-3.5">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto flex h-7 w-56 items-center justify-center rounded-md border border-gray-200 bg-white px-3">
                  <span className="text-[10px] text-gray-400">tickispot.com/dashboard</span>
                </div>
              </div>

              {/* Dashboard content mockup */}
              <div className="bg-gray-50 p-6">
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Tickets sold", value: "2,847", delta: "+18%", color: "text-pink-600" },
                    { label: "Revenue",       value: "₦4.2M",  delta: "+24%", color: "text-green-600" },
                    { label: "Live viewers",  value: "1,204",  delta: "Live", color: "text-red-500"  },
                    { label: "Events",        value: "12",     delta: "Active", color: "text-blue-600"},
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-4">
                      <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">{stat.label}</p>
                      <p className="mt-2 text-xl font-black text-gray-900">{stat.value}</p>
                      <p className={`mt-1 text-xs font-bold ${stat.color}`}>{stat.delta}</p>
                    </div>
                  ))}
                </div>

                {/* Chart + event list */}
                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_0.55fr]">
                  {/* Fake chart */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-700">Ticket sales , last 7 days</p>
                      <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[10px] font-bold text-pink-600">+18%</span>
                    </div>
                    <div className="flex h-24 items-end gap-1.5">
                      {[40, 65, 45, 80, 55, 90, 72].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-md transition-all"
                          style={{ height: `${h}%`, background: i === 5 ? "#ec4899" : "#fce7f3" }} />
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between">
                      {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                        <span key={d} className="flex-1 text-center text-[9px] text-gray-400">{d}</span>
                      ))}
                    </div>
                  </div>

                  {/* Live event card */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-700">Now streaming</p>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white">
                        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
                        LIVE
                      </span>
                    </div>
                    <div className="aspect-video overflow-hidden rounded-xl bg-gray-900">
                      <div className="h-full w-full bg-gradient-to-br from-gray-800 to-pink-900/40 flex items-center justify-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500/90">
                          <Play size={16} fill="white" className="text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-gray-800 truncate">Lagos Tech Summit 2025</p>
                    <p className="text-[10px] text-gray-400">1,204 watching · 3h 12m</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute hidden sm:block -right-4 top-24 rounded-2xl border border-green-100 bg-white px-4 py-3 shadow-xl">
              <p className="text-[10px] font-bold text-gray-400">Just sold</p>
              <p className="text-sm font-black text-gray-900">3× VIP tickets</p>
              <p className="text-[10px] text-green-600 font-bold">₦45,000 · 2 min ago</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ─────────────────────────────────────────────── */}
      {/* <section className="border-y border-gray-100 bg-gray-50 py-5">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
            {[
              { value: "10K+",  label: "Events hosted" },
              { value: "500K+", label: "Tickets sold"  },
              { value: "50K+",  label: "Organisers"    },
              { value: "99.9%", label: "Uptime"        },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <p className="text-2xl font-black text-gray-900 sm:text-3xl">{m.value}</p>
                <p className="text-xs font-medium text-gray-500">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── FEATURES GRID ────────────────────────────────────────────────── */}
      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-pink-500">
              Everything you need
            </p>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              One platform. Every event type.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
              From intimate workshops to 5,000-person concerts , TickiSpot scales with you.
            </p>
          </div>

          <div className="grid gap-px rounded-3xl border border-gray-100 bg-gray-100 overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <article key={feat.title}
                  className={cn(
                    "group relative bg-white p-8 transition-all hover:bg-pink-50/30",
                    i === 0 && "sm:col-span-2 lg:col-span-1"
                  )}>
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50 text-pink-500 transition-colors group-hover:bg-pink-500 group-hover:text-white">
                    <Icon size={20} />
                  </div>
                  <h3 className="mb-2 text-base font-black text-gray-900">{feat.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{feat.desc}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="bg-gray-950 px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-pink-400">How it works</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Live in four steps
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.n} className="relative rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                <span className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500 text-sm font-black text-white">
                  {step.n}
                </span>
                <h3 className="mb-2 font-black text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            {isLoggedIn ? (
              <button onClick={openCreateEvent}
                className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-pink-500/30 transition-all hover:bg-pink-400 hover:-translate-y-0.5">
                Create your first event
                <ArrowRight size={18} />
              </button>
            ) : (
              <Link to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-pink-500/30 transition-all hover:bg-pink-400 hover:-translate-y-0.5">
                Start free today
                <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      {/* <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-pink-500">Testimonials</p>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
              Loved by Nigerian organisers
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {SOCIAL_PROOF.map((t, i) => (
              <blockquote key={i}
                className={cn(
                  "relative overflow-hidden rounded-2xl p-8",
                  i === 1 ? "bg-pink-500 text-white" : "border border-gray-100 bg-white"
                )}>
                <div className="mb-4 flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={14} className={cn("fill-current", i === 1 ? "text-pink-200" : "text-amber-400")} />
                  ))}
                </div>
                <p className={cn("text-sm leading-relaxed", i === 1 ? "text-pink-50" : "text-gray-600")}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="mt-6">
                  <p className={cn("text-sm font-black", i === 1 ? "text-white" : "text-gray-900")}>{t.name}</p>
                  <p className={cn("text-xs", i === 1 ? "text-pink-200" : "text-gray-400")}>{t.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── EVENTS DIRECTORY ─────────────────────────────────────────────── */}
      <section className="border-t border-gray-100 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-widest text-pink-500">
                Discover
              </p>
              <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                {searchQuery
                  ? "Search results"
                  : selectedCategory === "all"
                    ? "Trending now"
                    : CATEGORIES.find((c) => c.id === selectedCategory)?.name}
              </h2>
            </div>
            {!searchQuery && (
              <Link to="/events"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-pink-500 hover:text-pink-600">
                View all <ChevronRight size={16} />
              </Link>
            )}
          </div>

          <div className="flex flex-col gap-8 lg:flex-row">
            {!searchQuery && (
              <aside className="lg:w-52 lg:shrink-0">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">Categories</p>
                <div className="flex flex-wrap gap-1.5 lg:flex-col">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const active = selectedCategory === cat.id;
                    return (
                      <button key={cat.id} type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                          active
                            ? "bg-pink-500 text-white shadow-lg shadow-pink-500/25"
                            : "bg-gray-50 text-gray-600 hover:bg-pink-50 hover:text-pink-600",
                        )}>
                        <Icon size={14} />
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </aside>
            )}

            <div className="min-w-0 flex-1">
              {loading ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {[1,2,3,4,5,6].map((n) => (
                    <div key={n} className="overflow-hidden rounded-2xl border border-gray-100">
                      <div className="h-40 animate-pulse bg-gray-100" />
                      <div className="space-y-2 p-4">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : display.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {display.map((event) => <EventCard key={event._id} event={event} />)}
                </div>
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-pink-100 bg-pink-50/30 text-center">
                  <Calendar size={36} className="text-pink-300" />
                  <p className="mt-4 font-bold text-gray-700">No events here yet.</p>
                  <p className="mt-1 text-sm text-gray-400">Be the first to host one in this category.</p>
                  {isLoggedIn && (
                    <button onClick={openCreateEvent}
                      className="mt-6 rounded-xl bg-pink-500 px-6 py-3 text-sm font-bold text-white hover:bg-pink-600 transition-colors">
                      Create event
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ───────────────────────────────────────────────── */}
      <section className="bg-gray-50 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-pink-500">Pricing</p>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Free to start. Grow when you're ready.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-gray-500">
            Every plan includes unlimited free events. Pay a small commission on paid tickets only.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              {
                name: "Free",
                price: "₦0",
                desc: "For getting started",
                features: [ "Create & publish events",
        "Sell tickets & email notifications",
        "Basic dashboard",
        "Standard visibility",],
                cta: "Start free",
                to: "/pricing",
                highlight: false,
              },
              {
                name: "Pro",
                price: "₦4,999",
                period: "/mo",
                desc: "For serious organisers",
                features: ["Unlimited events", "Livestreaming","TickiAI (event generation + concierge)", "Advanced analytics", "Priority support"],
                cta: "Start Pro trial",
                to: "/pricing",
                highlight: true,
              },
              {
                name: "Business",
                price: "Custom",
                desc: "For large organisations",
                features: ["White-label branding",
        "Dedicated success manager",
        "Advanced API access",
        "Custom contracts & SLAs",
        "Everything in Pro",],
                cta: "Contact us",
                to: "/contact",
                highlight: false,
              },
            ].map((plan) => (
              <div key={plan.name}
                className={cn(
                  "rounded-2xl p-7 text-left",
                  plan.highlight
                    ? "bg-pink-500 text-white shadow-2xl shadow-pink-500/30 scale-105"
                    : "border border-gray-200 bg-white"
                )}>
                <p className={cn("text-xs font-black uppercase tracking-widest", plan.highlight ? "text-pink-100" : "text-gray-400")}>
                  {plan.name}
                </p>
                <div className="mt-3 flex items-end gap-1">
                  <span className={cn("text-4xl font-black", plan.highlight ? "text-white" : "text-gray-900")}>{plan.price}</span>
                  {plan.period && <span className={cn("mb-1 text-sm", plan.highlight ? "text-pink-200" : "text-gray-400")}>{plan.period}</span>}
                </div>
                <p className={cn("mt-1 text-sm", plan.highlight ? "text-pink-100" : "text-gray-500")}>{plan.desc}</p>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={14} className={plan.highlight ? "text-pink-200" : "text-green-500"} />
                      <span className={plan.highlight ? "text-pink-50" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={plan.to}
                  className={cn(
                    "mt-8 block rounded-xl py-3 text-center text-sm font-bold transition-all",
                    plan.highlight
                      ? "bg-white text-pink-600 hover:bg-pink-50"
                      : "border-2 border-gray-200 text-gray-800 hover:border-pink-300 hover:text-pink-600"
                  )}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="bg-gray-950 px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-pink-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-pink-400">
            <Zap size={12} />
            Ready to launch?
          </span>
          <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Your next event starts
            <br />
            <span className="text-pink-500">here.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg text-gray-400">
            Join thousands of organisers across Nigeria who run their events on TickiSpot.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {isLoggedIn ? (
              <button onClick={openCreateEvent}
                className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-pink-500/40 transition-all hover:bg-pink-400 hover:-translate-y-0.5">
                Create an event
                <ArrowRight size={18} />
              </button>
            ) : (
              <Link to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-pink-500/40 transition-all hover:bg-pink-400 hover:-translate-y-0.5">
                Get started free
                <ArrowRight size={18} />
              </Link>
            )}
            <Link to="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-base font-bold text-white transition-all hover:bg-white/10">
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-gray-950 pb-12 pt-16 text-gray-400">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand column */}
            <div className="lg:col-span-2">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <img src={icon} className="h-9 w-9" alt="" />
                <span className="text-lg font-black text-white">
                  Ticki<span className="text-pink-400">Spot</span>
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed">
                Event ticketing, live streaming, and analytics , one home for your shows, conferences,
                and communities across Africa.
              </p>
              <div className="mt-5 flex gap-2">
                {[
                  { href: "https://x.com/tickispot",                          label: "X",         icon: <XLogo size={15} /> },
                  { href: "https://www.facebook.com/share/1ArixBJeTq/",       label: "Facebook",  icon: <Facebook size={16} /> },
                  { href: "https://www.instagram.com/tickispot",              label: "Instagram", icon: <Instagram size={16} /> },
                ].map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 transition-all hover:border-pink-500 hover:text-pink-400">
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                heading: "Product",
                links: [
                  { to: "/events",   label: "Events"       },
                  { to: "/pricing",  label: "Pricing"      },
                  { to: "/features", label: "Features"     },
                  { to: "/docs",     label: "Docs"         },
                ],
              },
              {
                heading: "Company",
                links: [
                  { to: "/about",    label: "About"        },
                  { to: "/contact",  label: "Contact"      },
                  { to: "/help",     label: "Help center"  },
                  { to: "/donation", label: "Support us"   },
                ],
              },
              {
                heading: "Legal",
                links: [
                  { to: "/privacy",  label: "Privacy"      },
                  { to: "/terms",    label: "Terms"        },
                ],
              },
            ].map((col) => (
              <div key={col.heading}>
                <p className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">{col.heading}</p>
                <ul className="space-y-2.5 text-sm">
                  {col.links.map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className="transition-colors hover:text-white">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-xs sm:flex-row">
            <p>© {new Date().getFullYear()} TickiSpot. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <Lock size={12} />
              <span>Secured payments powered by Paystack</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}