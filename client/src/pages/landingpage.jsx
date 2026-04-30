import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
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
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={true}
    >
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}
export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Categories for filtering
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
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
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEvents = () => {
    let filtered = events;
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (event) => event.category?.toLowerCase() === selectedCategory,
      );
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return filtered;
  };

  const filteredEvents = getFilteredEvents();
  const trendingEvents = Array.isArray(events)
    ? [...events]
        .sort((a, b) => (b.ticketsSold || 0) - (a.ticketsSold || 0))
        .slice(0, 6)
    : [];
  const featuredEvents =
    selectedCategory === "all" ? trendingEvents : filteredEvents.slice(0, 6);

  const features = [
    {
      icon: TicketCheck,
      title: "Smart Ticketing",
      description:
        "Create multiple ticket types, set pricing, and track sales in real-time",
    },
    {
      icon: Video,
      title: "Live Streaming",
      description:
        "Integrate YouTube, Vimeo, or custom RTMP streams for virtual events",
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description:
        "Real-time audience engagement with moderated chat during events",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description:
        "Comprehensive insights into ticket sales, audience engagement, and revenue",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description:
        "Multiple payment gateways with instant confirmation and refund handling",
    },
    {
      icon: Smartphone,
      title: "Mobile Ready",
      description:
        "Fully responsive design that works perfectly on all devices",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Event Organizer",
      company: "Tech Summit 2024",
      content:
        "TickiSpot transformed how we manage events. The analytics alone saved us hours of work!",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?u=sarah",
    },
    {
      name: "Michael Chen",
      role: "Marketing Director",
      company: "Music Festivals Inc",
      content:
        "The live streaming integration is seamless. Our virtual events have never been smoother.",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?u=michael",
    },
    {
      name: "Emily Rodriguez",
      role: "Conference Manager",
      company: "Business Connect",
      content:
        "The ticketing system is intuitive and our attendees love the QR code check-in process.",
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

  const quickTrustItems = [
    "No credit card required",
    "Go live in under 10 minutes",
    "Instant payouts & QR check-in",
  ];

  const buyerObjections = [
    {
      title: "Will my first event actually sell?",
      answer:
        "Yes. TickiSpot helps you launch with built-in discovery, clean checkout, and audience engagement tools that raise conversion from visit to ticket.",
    },
    {
      title: "Is setup complicated for new organizers?",
      answer:
        "No. You can create your page, ticket tiers, and payment flow in a guided setup designed for first-time organizers.",
    },
    {
      title: "Can I run online and offline events together?",
      answer:
        "Absolutely. Use one dashboard for in-person check-in, virtual stream access, attendee messaging, and post-event analytics.",
    },
  ];

  return (
    <div className="lp-page">
      <header className="lp-header">
        <div className="lp-shell lp-header-inner">
          <Link to="/" className="lp-brand">
            <img src={icon} className="tickispot-icon" alt="TickiSpot" />
            <span>TickiSpot</span>
          </Link>
          <nav className="lp-nav">
            <Link to="/events" className="lp-nav-link">
              Explore Events
            </Link>
            <Link to="/create" className="lp-nav-link">
              Create Event
            </Link>
            <Link to="/pricing" className="lp-nav-link">
              Pricing
            </Link>
            {isLoggedIn && (
              <Link to="/my-tickets" className="lp-nav-link">
                My Tickets
              </Link>
            )}
          </nav>
          <div className="lp-actions">
            {isLoggedIn ? (
              <Link to="/dashboard" className="lp-btn lp-btn-primary">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="lp-btn lp-btn-ghost">
                  Sign In
                </Link>
                <Link to="/register" className="lp-btn lp-btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-shell lp-hero-grid">
          <div>
            <p className="lp-kicker">Built for creators, campuses, and growing brands</p>
            <h1 className="lp-title">
              Turn first-time visitors into paying attendees in minutes.
            </h1>
            <p className="lp-subtitle">
              Launch high-converting event pages, sell tickets fast, and run
              smooth experiences from one modern platform. Everything is
              optimized for trust, speed, and repeat attendance.
            </p>
            <div className="lp-trust-row">
              {quickTrustItems.map((item) => (
                <span key={item}>
                  <CheckCircle2 size={14} />
                  {item}
                </span>
              ))}
            </div>
            <div className="lp-search">
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
              <p className="lp-search-feedback">
                {filteredEvents.length} result
                {filteredEvents.length === 1 ? "" : "s"} for "{searchQuery}"
              </p>
            )}
            <div className="lp-hero-cta">
              {isLoggedIn ? (
                <Link to="/create" className="lp-btn lp-btn-primary">
                  Launch My Event
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <Link to="/register" className="lp-btn lp-btn-primary">
                  Start Free Now
                  <ArrowRight size={16} />
                </Link>
              )}
              <Link to="/events" className="lp-btn lp-btn-secondary">
                See Live Examples
              </Link>
            </div>
            <div className="lp-proof">
              <span>50K+ active organizers</span>
              <span>500K+ tickets sold</span>
              <span>99.9% uptime</span>
            </div>
          </div>

          <aside className="lp-panel">
            <p className="lp-panel-label">7-Second Clarity</p>
            <h3>Everything you need to convert a new visitor fast</h3>
            <div className="lp-panel-stats">
              {stats.map((item) => (
                <div key={item.label}>
                  <strong>{item.number}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <ul className="lp-panel-points">
              <li>Optimized checkout flow with fewer drop-offs</li>
              <li>Real-time demand insight to adjust pricing fast</li>
              <li>Built-in social proof and attendee momentum</li>
            </ul>
            <Link to="/pricing" className="lp-panel-link">
              Compare plans
              <ArrowRight size={14} />
            </Link>
          </aside>
        </div>
      </section>

      <section className="lp-discover">
        <div className="lp-shell">
          {!searchQuery && (
            <>
              <div className="lp-section-head">
                <h2>Browse by category</h2>
              </div>
              <div className="lp-categories">
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.id}
                      className={`lp-chip ${selectedCategory === category.id ? "is-active" : ""}`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <IconComponent size={16} />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="lp-section-head">
            <h2>
              {searchQuery
                ? "Search Results"
                : selectedCategory === "all"
                  ? "Trending events"
                  : `${selectedCategory[0].toUpperCase()}${selectedCategory.slice(1)} events`}
            </h2>
            {!searchQuery && (
              <Link to="/events" className="lp-inline-link">
                View all
                <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="lp-grid lp-grid-loading">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="lp-skeleton" />
              ))}
            </div>
          ) : (
            <>
              {(searchQuery ? filteredEvents : featuredEvents).length > 0 ? (
                <div className="lp-grid">
                  {(searchQuery ? filteredEvents : featuredEvents).map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="lp-empty">
                  <p>No events found for this view.</p>
                  {isLoggedIn && (
                    <Link to="/create" className="lp-btn lp-btn-primary">
                      Create Event
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="lp-stats">
        <div className="lp-shell lp-stats-grid">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <article key={stat.label} className="lp-stat">
                <IconComponent size={18} />
                <strong>{stat.number}</strong>
                <span>{stat.label}</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="lp-features">
        <div className="lp-shell">
          <div className="lp-section-head">
            <h2>Built to increase conversion at every step</h2>
          </div>
          <div className="lp-features-grid">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <article key={feature.title} className="lp-feature">
                  <IconComponent size={18} />
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="lp-testimonials">
        <div className="lp-shell">
          <div className="lp-section-head">
            <h2>Loved by organizers</h2>
          </div>
          <div className="lp-testimonial-grid">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="lp-testimonial">
                <div className="lp-stars">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p>{testimonial.content}</p>
                <div className="lp-author">
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

      <section className="lp-steps">
        <div className="lp-shell">
          <div className="lp-section-head">
            <h2>Simple flow. Strong results.</h2>
          </div>
          <div className="lp-step-grid">
            <article className="lp-step">
              <span>01</span>
              <h3>Create Event</h3>
              <p>Set details, ticket tiers, and event policy in minutes.</p>
            </article>
            <article className="lp-step">
              <span>02</span>
              <h3>Sell Tickets</h3>
              <p>Launch checkout instantly with secure payment support.</p>
            </article>
            <article className="lp-step">
              <span>03</span>
              <h3>Run Smoothly</h3>
              <p>Use QR check-ins, livestreams, and chat for engagement.</p>
            </article>
            <article className="lp-step">
              <span>04</span>
              <h3>Optimize</h3>
              <p>Track conversion, attendance, and revenue performance.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="lp-objections">
        <div className="lp-shell">
          <div className="lp-section-head">
            <h2>Questions first-time organizers ask</h2>
          </div>
          <div className="lp-objection-grid">
            {buyerObjections.map((item) => (
              <article key={item.title} className="lp-objection">
                <h3>{item.title}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-cta">
        <div className="lp-shell lp-cta-inner">
          <h2>Ready to launch a modern event page that converts fast?</h2>
          <p>
            Join organizers using TickiSpot to drive ticket sales from the
            first impression and grow repeat attendance.
          </p>
          <div className="lp-hero-cta">
            {isLoggedIn ? (
              <Link to="/create" className="lp-btn lp-btn-primary">
                Create Your Event
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link to="/register" className="lp-btn lp-btn-primary">
                Start Free Trial
                <ArrowRight size={16} />
              </Link>
            )}
            <Link to="/events" className="lp-btn lp-btn-secondary">
              Browse Events
            </Link>
          </div>
          <div className="lp-cta-trust">
            <CheckCircle2 size={14} />
            <span>No credit card required</span>
            <span>14-day free trial</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-shell">
          <div className="lp-footer-grid">
            <div>
              <div className="lp-brand">
                <img src={icon} className="tickispot-icon" alt="TickiSpot" />
                <span>TickiSpot</span>
              </div>
              <p className="lp-footer-copy">
                Complete event infrastructure for teams building standout
                experiences.
              </p>
              <div className="lp-footer-social">
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

            <div className="lp-footer-links">
              <h4>Product</h4>
              <Link to="/events">Events</Link>
              <Link to="/create">Create</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/docs">Docs</Link>
            </div>

            <div className="lp-footer-links">
              <h4>Company</h4>
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/help">Help Center</Link>
              <Link to="/founder">Founder</Link>
            </div>

            <div className="lp-footer-links">
              <h4>Legal</h4>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/donate">Donate</Link>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <p>© 2026 TickiSpot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
