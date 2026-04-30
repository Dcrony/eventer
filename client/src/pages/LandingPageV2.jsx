import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./CSS/landing.css";
import icon from "../assets/icon.svg";
import EventCard from "../components/EventCard";
import API from "../api/axios";
import Avatar from "../components/ui/avatar";
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
    {
      icon: TicketCheck,
      title: "Smart Ticketing",
      description: "Multi-tier pricing, limits, and live sales visibility.",
    },
    {
      icon: Video,
      title: "Live Streaming",
      description: "Run virtual events with reliable, low-friction workflows.",
    },
    {
      icon: MessageSquare,
      title: "Audience Chat",
      description: "Keep attendees engaged before, during, and after sessions.",
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Track funnel, conversion, attendance, and revenue in one view.",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Trusted checkout with confirmation and refund controls.",
    },
    {
      icon: Smartphone,
      title: "Mobile Ready",
      description: "Consistent experience across phone, tablet, and desktop.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Event Organizer",
      company: "Tech Summit 2024",
      content:
        "TickiSpot transformed how we manage events. The analytics alone saved us hours weekly.",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?u=sarah",
    },
    {
      name: "Michael Chen",
      role: "Marketing Director",
      company: "Music Festivals Inc",
      content:
        "Our team finally has one source of truth for ticketing, content, and engagement.",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?u=michael",
    },
    {
      name: "Emily Rodriguez",
      role: "Conference Manager",
      company: "Business Connect",
      content:
        "The check-in and post-event reporting experience feels built for professional operators.",
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
    const byCategory =
      selectedCategory === "all" ||
      event.category?.toLowerCase() === selectedCategory;
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

  return (
    <div className="lp2-page">
      <header className="lp2-header">
        <div className="lp2-shell lp2-header-inner">
          <Link to="/" className="lp2-brand">
            <img src={icon} className="tickispot-icon" alt="TickiSpot" />
            <span>TickiSpot</span>
          </Link>
          <nav className="lp2-nav">
            <Link to="/events" className="lp2-nav-link">
              Explore Events
            </Link>
            <Link to="/create" className="lp2-nav-link">
              Create Event
            </Link>
            <Link to="/pricing" className="lp2-nav-link">
              Pricing
            </Link>
            {isLoggedIn && (
              <Link to="/my-tickets" className="lp2-nav-link">
                My Tickets
              </Link>
            )}
          </nav>
          <div className="lp2-actions">
            {isLoggedIn ? (
              <Link to="/dashboard" className="lp2-btn lp2-btn-primary">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="lp2-btn lp2-btn-ghost">
                  Sign In
                </Link>
                <Link to="/register" className="lp2-btn lp2-btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="lp2-hero">
        <div className="lp2-shell lp2-hero-grid">
          <div>
            <p className="lp2-kicker">Event infrastructure for serious teams</p>
            <h1 className="lp2-title">
              Design, sell, and run standout events without operational chaos.
            </h1>
            <p className="lp2-subtitle">
              TickiSpot combines ticketing, live delivery, and analytics into
              one elegant workflow so your team scales quality, not complexity.
            </p>
            <div className="lp2-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search events by title, location, or category"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="button" aria-label="Search events">
                <ArrowRight size={16} />
              </button>
            </div>
            {searchQuery && (
              <p className="lp2-search-feedback">
                {filteredEvents.length} result
                {filteredEvents.length === 1 ? "" : "s"} for "{searchQuery}"
              </p>
            )}
            <div className="lp2-hero-cta">
              {isLoggedIn ? (
                <Link to="/create" className="lp2-btn lp2-btn-primary">
                  Create Event
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <Link to="/register" className="lp2-btn lp2-btn-primary">
                  Start Free
                  <ArrowRight size={16} />
                </Link>
              )}
              <Link to="/events" className="lp2-btn lp2-btn-secondary">
                Browse Events
              </Link>
            </div>
            <div className="lp2-proof">
              <span>50K+ active organizers</span>
              <span>500K+ tickets sold</span>
              <span>99.9% uptime</span>
            </div>
          </div>

          <aside className="lp2-hero-stack">
            <article className="lp2-panel">
              <p className="lp2-panel-label">Platform Snapshot</p>
              <h3>Built for premium event execution</h3>
              <div className="lp2-panel-stats">
                {stats.map((item) => (
                  <div key={item.label}>
                    <strong>{item.number}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
              <Link to="/pricing" className="lp2-panel-link">
                Compare plans
                <ArrowRight size={14} />
              </Link>
            </article>
            <article className="lp2-mini-board">
              <p>Used by teams in:</p>
              <div>
                <span>Conferences</span>
                <span>Festivals</span>
                <span>Campus events</span>
                <span>Creator communities</span>
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section className="lp2-process">
        <div className="lp2-shell">
          <div className="lp2-section-head">
            <h2>How teams run events with TickiSpot</h2>
          </div>
          <div className="lp2-process-grid">
            <article>
              <span>01</span>
              <h3>Plan</h3>
              <p>Create event pages, tickets, and launch assets in one flow.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Launch</h3>
              <p>Open sales instantly with secure checkout and smart controls.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Operate</h3>
              <p>Handle admissions, livestreams, and audience engagement live.</p>
            </article>
            <article>
              <span>04</span>
              <h3>Improve</h3>
              <p>Use analytics to optimize conversion and retention every time.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="lp2-capabilities">
        <div className="lp2-shell">
          <div className="lp2-section-head">
            <h2>Core capabilities</h2>
          </div>
          <div className="lp2-bento">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <article key={feature.title} className="lp2-bento-card">
                  <IconComponent size={18} />
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="lp2-market">
        <div className="lp2-shell">
          <div className="lp2-section-head">
            <h2>
              {searchQuery
                ? "Search results"
                : selectedCategory === "all"
                  ? "Featured events"
                  : `${selectedCategory[0].toUpperCase()}${selectedCategory.slice(1)} events`}
            </h2>
            {!searchQuery && (
              <Link to="/events" className="lp2-inline-link">
                View all events
                <ArrowRight size={14} />
              </Link>
            )}
          </div>

          <div className="lp2-market-layout">
            {!searchQuery && (
              <aside className="lp2-sidebar">
                <h3>Categories</h3>
                <div className="lp2-categories">
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <button
                        key={category.id}
                        className={`lp2-chip ${selectedCategory === category.id ? "is-active" : ""}`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <IconComponent size={15} />
                        <span>{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              </aside>
            )}

            <div>
              {loading ? (
                <div className="lp2-grid lp2-grid-loading">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="lp2-skeleton" />
                  ))}
                </div>
              ) : (
                <>
                  {(searchQuery ? filteredEvents : featuredEvents).length > 0 ? (
                    <div className="lp2-grid">
                      {(searchQuery ? filteredEvents : featuredEvents).map((event) => (
                        <EventCard key={event._id} event={event} />
                      ))}
                    </div>
                  ) : (
                    <div className="lp2-empty">
                      <p>No events found for this selection.</p>
                      {isLoggedIn && (
                        <Link to="/create" className="lp2-btn lp2-btn-primary">
                          Create Event
                        </Link>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="lp2-stats">
        <div className="lp2-shell lp2-stats-grid">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <article key={stat.label} className="lp2-stat">
                <IconComponent size={18} />
                <strong>{stat.number}</strong>
                <span>{stat.label}</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="lp2-testimonials">
        <div className="lp2-shell">
          <div className="lp2-section-head">
            <h2>What organizers say</h2>
          </div>
          <div className="lp2-testimonial-grid">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="lp2-testimonial">
                <div className="lp2-stars">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p>{testimonial.content}</p>
                <div className="lp2-author">
                  <Avatar
                    src={testimonial.avatar}
                    name={testimonial.name}
                    className="author-avatar"
                    alt={testimonial.name}
                  />
                  <div>
                    <strong>{testimonial.name}</strong>
                    <span>
                      {testimonial.role} · {testimonial.company}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp2-cta">
        <div className="lp2-shell lp2-cta-inner">
          <h2>Move from event hustle to event excellence.</h2>
          <p>
            Join the teams using TickiSpot to deliver premium event experiences
            with operational confidence.
          </p>
          <div className="lp2-hero-cta">
            {isLoggedIn ? (
              <Link to="/create" className="lp2-btn lp2-btn-primary">
                Create Your Event
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link to="/register" className="lp2-btn lp2-btn-primary">
                Start Free Trial
                <ArrowRight size={16} />
              </Link>
            )}
            <Link to="/events" className="lp2-btn lp2-btn-secondary">
              Browse Events
            </Link>
          </div>
          <div className="lp2-cta-trust">
            <CheckCircle2 size={14} />
            <span>No credit card required</span>
            <span>14-day free trial</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </section>

      <footer className="lp2-footer">
        <div className="lp2-shell">
          <div className="lp2-footer-grid">
            <div>
              <div className="lp2-brand">
                <img src={icon} className="tickispot-icon" alt="TickiSpot" />
                <span>TickiSpot</span>
              </div>
              <p className="lp2-footer-copy">
                Complete event infrastructure for teams building memorable
                experiences.
              </p>
              <div className="lp2-footer-social">
                <a
                  href="https://x.com/tickispot"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TickiSpot on X"
                >
                  <XLogo size={17} />
                </a>
                <a
                  href="https://www.facebook.com/share/1ArixBJeTq/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TickiSpot on Facebook"
                >
                  <Facebook size={18} strokeWidth={1.75} aria-hidden={true} />
                </a>
                <a
                  href="https://www.tiktok.com/@tickispot?_r=1&_t=ZS-95sxo4URp72"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TickiSpot on TikTok"
                >
                  <Globe size={18} strokeWidth={1.75} aria-hidden={true} />
                </a>
                <a
                  href="https://www.instagram.com/tickispot?igsh=a2oyMzIyandnb2J2"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TickiSpot on Instagram"
                >
                  <Instagram size={18} strokeWidth={1.75} aria-hidden={true} />
                </a>
              </div>
            </div>

            <div className="lp2-footer-links">
              <h4>Product</h4>
              <Link to="/events">Events</Link>
              <Link to="/create">Create</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/docs">Docs</Link>
            </div>

            <div className="lp2-footer-links">
              <h4>Company</h4>
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/help">Help Center</Link>
              <Link to="/founder">Founder</Link>
            </div>

            <div className="lp2-footer-links">
              <h4>Legal</h4>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/donate">Donate</Link>
            </div>
          </div>
          <div className="lp2-footer-bottom">
            <p>© 2026 TickiSpot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
