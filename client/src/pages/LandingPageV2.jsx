import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import icon from "../assets/icon.svg";
import EventCard from "../components/EventCard";
import API from "../api/axios";
import Avatar from "../components/ui/avatar";
import { useCreateEvent } from "../context/CreateEventContext";

import {
  TicketCheck,
  Shield,
  BarChart3,
  Smartphone,
  Video,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Star,
  Calendar,
  Users,
  TrendingUp,
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

export default function LandingPageV2() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { openCreateEvent } = useCreateEvent();

  const categories = [
    { id: "all", name: "All Events", icon: Calendar },
    { id: "music", name: "Music", icon: Music },
    { id: "tech", name: "Tech", icon: Laptop },
    { id: "business", name: "Business", icon: Briefcase },
    { id: "campus", name: "Campus", icon: GraduationCap },
    { id: "online", name: "Online", icon: Globe },
    { id: "comedy", name: "Comedy", icon: Mic2 },
    { id: "workshop", name: "Workshop", icon: Wrench },
  ];

  const features = [
    { icon: TicketCheck, title: "Smart Ticketing", description: "Multi-tier pricing, limits, and live sales visibility." },
    { icon: Video, title: "Live Streaming", description: "Run virtual events with reliable, low-friction workflows." },
    { icon: MessageSquare, title: "Audience Chat", description: "Keep attendees engaged before, during, and after sessions." },
    { icon: BarChart3, title: "Analytics", description: "Track funnel, conversion, attendance, and revenue in one view." },
    { icon: Shield, title: "Secure Payments", description: "Trusted checkout with confirmation and refund controls." },
    { icon: Smartphone, title: "Mobile Ready", description: "Consistent experience across phone, tablet, and desktop." },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Event Organizer",
      company: "Tech Summit 2024",
      content: "TickiSpot transformed how we manage events. The analytics alone saved us hours weekly.",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?u=sarah",
    },
    {
      name: "Michael Chen",
      role: "Marketing Director",
      company: "Music Festivals Inc",
      content: "Our team finally has one source of truth for ticketing, content, and engagement.",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?u=michael",
    },
    {
      name: "Emily Rodriguez",
      role: "Conference Manager",
      company: "Business Connect",
      content: "The check-in and post-event reporting experience feels built for professional operators.",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?u=emily",
    },
  ];

  const stats = [
    { number: "10K+", label: "Events Created", icon: Calendar },
    { number: "500K+", label: "Tickets Sold", icon: TicketCheck },
    { number: "50K+", label: "Active Users", icon: Users },
    { number: "99.9%", label: "Uptime", icon: TrendingUp },
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
    const byCategory = selectedCategory === "all" || event.category?.toLowerCase() === selectedCategory;
    const bySearch = !searchQuery ||
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return byCategory && bySearch;
  });

  const trendingEvents = [...events]
    .sort((a, b) => (b.ticketsSold || 0) - (a.ticketsSold || 0))
    .slice(0, 6);

  const featuredEvents = selectedCategory === "all" ? trendingEvents : filteredEvents.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/20 font-inter">
      {/* Header */}
      <header className="sticky top-0 px-4 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto  sm:px-6 ">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
              <img src={icon} className="w-8 h-8" alt="TickiSpot" />
              <span className="text-lg">TickiSpot</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/events" className="text-sm font-medium text-gray-600 hover:text-pink-500 transition-colors">Explore Events</Link>
              <Link to="/pricing" className="text-sm font-medium text-gray-600 hover:text-pink-500 transition-colors">Pricing</Link>
              <Link to="/donation" className="text-sm font-medium text-gray-600 hover:text-pink-500 transition-colors">Support us</Link>
              {isLoggedIn && (
                <Link to="/my-tickets" className="text-sm font-medium text-gray-600 hover:text-pink-500 transition-colors">My Tickets</Link>
              )}
            </nav>

            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <Link to="/dashboard" className="px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 transition-all shadow-md shadow-pink-500/25">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 text-sm font-semibold hover:border-pink-300 hover:text-pink-500 transition-all">
                    Sign In
                  </Link>
                  <Link to="/register" className="px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 transition-all shadow-md shadow-pink-500/25">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 lg:py-20 px-4">
        <div className="max-w-6xl mx-auto  sm:px-6 ">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
            {/* Left Column */}
            <div>
              <p className="text-pink-600 text-xs font-bold uppercase tracking-wider mb-3">Event infrastructure for serious teams</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                Design, sell, and run standout events without operational chaos.
              </h1>
              <p className="text-gray-500 text-lg mt-4 max-w-lg">
                TickiSpot combines ticketing, live delivery, and analytics into one elegant workflow so your team scales quality, not complexity.
              </p>

              {/* Search Bar */}
              <div className="mt-6 flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
                <Search size={18} className="text-gray-400 ml-2" />
                <input
                  type="text"
                  placeholder="Search events by title, location, or category"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 outline-none bg-transparent text-gray-900 text-sm"
                />
                <button className="w-9 h-9 rounded-lg bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 transition-colors">
                  <ArrowRight size={16} />
                </button>
              </div>

              {searchQuery && (
                <p className="text-sm text-gray-500 mt-2">
                  {filteredEvents.length} result{filteredEvents.length !== 1 ? "s" : ""} for "{searchQuery}"
                </p>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 mt-5">
                {isLoggedIn ? (
                  <button onClick={openCreateEvent} className="px-5 py-2.5 rounded-full bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-all shadow-md shadow-pink-500/25">
                    Create Event <ArrowRight size={16} className="inline ml-1" />
                  </button>
                ) : (
                  <Link to="/register" className="px-5 py-2.5 rounded-full bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-all shadow-md shadow-pink-500/25">
                    Start Free <ArrowRight size={16} className="inline ml-1" />
                  </Link>
                )}
                <Link to="/events" className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 font-semibold hover:border-pink-300 hover:text-pink-500 transition-all">
                  Browse Events
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-2 mt-5">
                <span className="px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600">50K+ active organizers</span>
                <span className="px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600">500K+ tickets sold</span>
                <span className="px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600">99.9% uptime</span>
              </div>
            </div>

            {/* Right Column - Stats Panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <p className="text-pink-600 text-xs font-bold uppercase tracking-wider">Platform Snapshot</p>
                <h3 className="text-lg font-bold text-gray-900 mt-2 mb-4">Built for premium event execution</h3>
                <div className="grid grid-cols-2 gap-3">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="border border-gray-100 rounded-lg p-3">
                        <Icon size={16} className="text-pink-500" />
                        <strong className="block text-base font-extrabold text-gray-900 mt-1">{stat.number}</strong>
                        <span className="text-xs text-gray-500">{stat.label}</span>
                      </div>
                    );
                  })}
                </div>
                <Link to="/pricing" className="inline-flex items-center gap-1 text-sm font-semibold text-pink-500 mt-3 hover:gap-2 transition-all">
                  Compare plans <ArrowRight size={14} />
                </Link>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500 mb-2">Used by teams in:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">Conferences</span>
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">Festivals</span>
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">Campus events</span>
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">Creator communities</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-12 bg-white px-4">
        <div className="max-w-6xl mx-auto ">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">How teams run events with TickiSpot</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { number: "01", title: "Plan", desc: "Create event pages, tickets, and launch assets in one flow." },
              { number: "02", title: "Launch", desc: "Open sales instantly with secure checkout and smart controls." },
              { number: "03", title: "Operate", desc: "Handle admissions, livestreams, and audience engagement live." },
              { number: "04", title: "Improve", desc: "Use analytics to optimize conversion and retention every time." },
            ].map((step) => (
              <article key={step.number} className="bg-gray-50 rounded-xl border border-gray-200 p-4 transition-all hover:-translate-y-1 hover:shadow-md">
                <span className="inline-flex w-8 h-8 rounded-full bg-pink-100 text-pink-600 items-center justify-center text-sm font-bold">{step.number}</span>
                <h3 className="text-base font-bold text-gray-900 mt-3 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto  sm:px-6 ">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Core capabilities</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="bg-white rounded-xl border border-gray-200 p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                  <Icon size={22} className="text-pink-500" />
                  <h3 className="text-base font-bold text-gray-900 mt-3 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-12 bg-gray-50 px-4">
        <div className="max-w-6xl mx-auto  sm:px-6 ">
          <div className="flex flex-wrap justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              {searchQuery
                ? "Search results"
                : selectedCategory === "all"
                  ? "Featured events"
                  : `${selectedCategory[0].toUpperCase()}${selectedCategory.slice(1)} events`}
            </h2>
            {!searchQuery && (
              <Link to="/events" className="inline-flex items-center gap-1 text-sm font-semibold text-pink-500 hover:gap-2 transition-all">
                View all events <ArrowRight size={14} />
              </Link>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Categories Sidebar */}
            {!searchQuery && (
              <aside className="lg:w-64 flex-shrink-0">
                <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
                  <h3 className="font-bold text-gray-900 mb-3">Categories</h3>
                  <div className="space-y-1">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedCategory === category.id
                              ? "bg-gray-900 text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <Icon size={14} />
                          {category.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>
            )}

            {/* Events Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse">
                      <div className="h-32 bg-gray-200 rounded-t-xl" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (searchQuery ? filteredEvents : featuredEvents).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 pb-20">
                  {(searchQuery ? filteredEvents : featuredEvents).map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <p className="text-gray-500 mb-4">No events found for this selection.</p>
                  {isLoggedIn && (
                    <button onClick={openCreateEvent} className="px-4 py-2 rounded-full bg-pink-500 text-white font-semibold hover:bg-pink-600">
                      Create Event
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto  sm:px-6 ">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <Icon size={24} className="text-pink-500 mx-auto mb-2" />
                  <strong className="block text-2xl font-extrabold text-gray-900">{stat.number}</strong>
                  <span className="text-sm text-gray-500">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-gray-50 px-4">
        <div className="max-w-6xl mx-auto  sm:px-6 ">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">What organizers say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="bg-white rounded-xl border border-gray-200 p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex gap-0.5 text-amber-400 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{testimonial.content}</p>
                <div className="flex items-center gap-3">
                  <Avatar src={testimonial.avatar} name={testimonial.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <strong className="text-sm font-bold text-gray-900 block">{testimonial.name}</strong>
                    <span className="text-xs text-gray-500">{testimonial.role} · {testimonial.company}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto  sm:px-6 ">
          <div className="bg-pink-500 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Move from event hustle to event excellence.</h2>
            <p className="text-white/90 mb-6 max-w-lg mx-auto">
              Join the teams using TickiSpot to deliver premium event experiences with operational confidence.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {isLoggedIn ? (
                <button onClick={openCreateEvent} className="px-6 py-2.5 rounded-full bg-white text-pink-600 font-semibold hover:bg-gray-100 transition-all shadow-md">
                  Create Event <ArrowRight size={16} className="inline ml-1" />
                </button>
              ) : (
                <Link to="/register" className="px-6 py-2.5 rounded-full bg-white text-pink-600 font-semibold hover:bg-gray-100 transition-all shadow-md">
                  Start Free Trial <ArrowRight size={16} className="inline ml-1" />
                </Link>
              )}
              <Link to="/events" className="px-6 py-2.5 rounded-full bg-white/20 text-white font-semibold hover:bg-white/30 transition-all">
                Browse Events
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-5 text-sm">
              <CheckCircle2 size={14} className="inline mr-1" /> No credit card required
              <CheckCircle2 size={14} className="inline mr-1" /> 14-day free trial
              <CheckCircle2 size={14} className="inline mr-1" /> Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto  sm:px-6 ">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={icon} className="w-8 h-8" alt="TickiSpot" />
                <span className="text-white font-bold">TickiSpot</span>
              </div>
              <p className="text-sm">Complete event infrastructure for teams building memorable experiences.</p>
              <div className="flex gap-3 mt-4">
                <a href="https://x.com/tickispot" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center hover:border-pink-500 hover:text-pink-500 transition-colors">
                  <XLogo size={16} />
                </a>
                <a href="https://www.facebook.com/share/1ArixBJeTq/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center hover:border-pink-500 hover:text-pink-500 transition-colors">
                  <Facebook size={16} />
                </a>
                <a href="https://www.instagram.com/tickispot" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center hover:border-pink-500 hover:text-pink-500 transition-colors">
                  <Instagram size={16} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/events" className="hover:text-pink-500 transition-colors">Events</Link></li>
                {isLoggedIn ? (
                  <li><button onClick={openCreateEvent} className="hover:text-pink-500 transition-colors">Create Event</button></li>
                ) : (
                  <li><Link to="/login" className="hover:text-pink-500 transition-colors">Create Event</Link></li>
                )}
                <li><Link to="/pricing" className="hover:text-pink-500 transition-colors">Pricing</Link></li>
                <li><Link to="/docs" className="hover:text-pink-500 transition-colors">Docs</Link></li>
                <li><Link to="/faq" className="hover:text-pink-500 transition-colors">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-pink-500 transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-pink-500 transition-colors">Contact</Link></li>
                <li><Link to="/help" className="hover:text-pink-500 transition-colors">Help Center</Link></li>
                <li><Link to="/founder" className="hover:text-pink-500 transition-colors">Founder</Link></li>
                <li><Link to="/features" className="hover:text-pink-500 transition-colors">Features</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-pink-500 transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-pink-500 transition-colors">Terms</Link></li>
                <li><Link to="/donation" className="hover:text-pink-500 transition-colors">Donate</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs">
            <p>© 2026 TickiSpot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}