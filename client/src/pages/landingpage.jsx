import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./CSS/landing.css";
import icon from "../assets/icon.svg";
import EventCard from "../components/EventCard";
import API from "../api/axios";


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
  MapPin,
  Users,
  TrendingUp,
  Search,
  Filter,
  Music,
  Laptop,
  Briefcase,
  GraduationCap,
  Globe,
  Mic2,
  Wrench,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
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

    // Fetch events
    fetchEvents();

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    document.body.classList.toggle("dark-mode", prefersDark);
  }, []);

  // Scroll animation observer
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll(
      ".stat-item, .feature-card, .testimonial-card, .section-header, .category-chip, .event-card",
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [events]);

  
 // Add this function at the top of your LandingPage component
const fetchEvents = async () => {
  try {
    setLoading(true);
    const response = await API.get("/events"); // Use the same API instance
    setEvents(response.data);
  } catch (error) {
    console.error("Error fetching events:", error);
    // Optionally set an error state to show user
    const response = await fetch(
      import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/events`
        : "/api/events"
    );

    const data = await response.json();

    console.log("LANDING EVENTS:", data); // 🔍 debug

    const eventsArray = Array.isArray(data)
      ? data
      : data.events || [];

    setEvents(eventsArray);
  } catch (error) {
    console.error("Error fetching events:", error);
    setEvents([]); // 👈 prevent crash
  } finally {
    setLoading(false);
  }
};

  // Filter events based on category and search
  const getFilteredEvents = () => {
    let filtered = events;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (event) => event.category?.toLowerCase() === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="landing-page">
      {/* Grid Background */}
      <div className="grid-background"></div>

      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <Link to="/" className="logo">
            <img src={icon} className="tickispot-icon" alt="TickiSpot" />
            <h1>TickiSpot</h1>
          </Link>
          <nav className="nav-menu">
            <Link to="/events" className="nav-link">
              Explore Events
            </Link>
            <Link to="/create" className="nav-link">
              Create Event
            </Link>
            <Link to="/pricing" className="nav-link">
              Pricing
            </Link>
            {isLoggedIn && (
              <>
                <Link to="/my-tickets" className="nav-link">
                  My Tickets
                </Link>
                <Link to="/dashboard" className="nav-link">
                  Dashboard
                </Link>
              </>
            )}
            {isLoggedIn ? (
              <div className="user-menu">
                <Link to="/dashboard" className="btn btn-primary">
                  Dashboard
                </Link>
              </div>
            ) : (
              <div className="log">
                <Link to="/login" className="btn btn-text">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section - Redesigned */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text-container">
            <div className="hero-badge">
              <span className="badge-pulse">✨ The Future of Events</span>
            </div>
            <h1 className="hero-title">
              <span className="hero-text-gradient">Host Events.</span>
              <br />
              <span className="hero-text-highlight">Sell Tickets.</span>
              <br />
              <span className="hero-text-gradient">Stream Live.</span>
            </h1>
            <p className="hero-description">
              Create unforgettable experiences with the all-in-one platform for
              in-person and virtual events. Join 50,000+ organizers who trust
              TickiSpot.
            </p>
            
            {/* Search Bar */}
            <div className="hero-search">
              <div className="search-container">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search events by title, location, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button className="search-btn">
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>

            <div className="hero-cta">
              {isLoggedIn ? (
                <>
                  <Link to="/create" className="btn btn-primary btn-large">
                    Create Your Event
                    <ArrowRight size={20} />
                  </Link>
                  <Link to="/events" className="btn btn-secondary btn-large">
                    Browse Events
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-large">
                    Start Free Trial
                    <ArrowRight size={20} />
                  </Link>
                  <Link to="/events" className="btn btn-secondary btn-large">
                    Explore Events
                  </Link>
                </>
              )}
            </div>

            {/* Social Proof */}
            <div className="hero-stats-mini">
              <div className="stat-mini-item">
                <span className="stat-mini-number">50K+</span>
                <span className="stat-mini-label">Active Users</span>
              </div>
              <div className="stat-mini-item">
                <span className="stat-mini-number">500K+</span>
                <span className="stat-mini-label">Tickets Sold</span>
              </div>
              <div className="stat-mini-item">
                <span className="stat-mini-number">10K+</span>
                <span className="stat-mini-label">Events Created</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - New */}
      <section className="categories-section">
        <div className="categories-container">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-box title-box-border">Browse by</span>
              <span className="title-box title-box-filled">Category</span>
            </h2>
            <p className="section-subtitle">
              Find your next experience across thousands of events
            </p>
          </div>

          <div className="categories-grid">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  className={`category-chip ${
                    selectedCategory === category.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <IconComponent size={20} />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trending Events Section - New */}
      <section className="trending-events-section">
        <div className="trending-container">
          <div className="section-header with-view-all">
            <div>
              <h2 className="section-title">
                <span className="title-box title-box-border">Trending</span>
                <span className="title-box title-box-filled">Events</span>
              </h2>
              <p className="section-subtitle">Popular this week near you</p>
            </div>
            <Link to="/events" className="view-all-link">
              View All Events
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="events-loading">
              {[1, 2, 3].map((n) => (
                <div key={n} className="event-card-skeleton">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-details"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="events-grid">
                {trendingEvents.length > 0 ? (
                  trendingEvents.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))
                ) : (
                  <div className="no-events">
                    <p>No trending events yet. Be the first to create one!</p>
                    <Link to="/create" className="btn btn-primary">
                      Create Event
                    </Link>
                  </div>
                )}
              </div>

              {filteredEvents.length > 0 && searchQuery && (
                <div className="search-results">
                  <h3>Search Results</h3>
                  <div className="events-grid">
                    {filteredEvents.slice(0, 3).map((event) => (
                      <EventCard key={event._id} event={event} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Stats Section with Icons */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                className="stat-item"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="stat-icon-wrapper">
                  <IconComponent className="stat-icon" size={32} />
                </div>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="feature-content">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-box title-box-border">Everything</span>
              <span className="title-box title-box-filled">you need</span>
            </h2>
            <p className="section-subtitle">
              Powerful tools designed to make event management effortless and
              enjoyable
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="feature-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="feature-icon-wrapper">
                    <IconComponent className="feature-icon" size={24} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section with Avatars */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-box title-box-border">Loved by</span>
              <span className="title-box title-box-filled">organizers</span>
            </h2>
            <p className="section-subtitle">
              See what our customers have to say about their experience with
              TickiSpot
            </p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="testimonial-card"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="star-icon"
                      size={16}
                      fill="currentColor"
                    />
                  ))}
                </div>
                <p className="testimonial-content">"{testimonial.content}"</p>
                <div className="testimonial-author">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="author-avatar"
                  />
                  <div className="author-info">
                    <div className="author-name">{testimonial.name}</div>
                    <div className="author-role">
                      {testimonial.role} · {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - New */}
      <section className="how-it-works">
        <div className="how-it-works-container">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-box title-box-border">How</span>
              <span className="title-box title-box-filled">it works</span>
            </h2>
            <p className="section-subtitle">
              Get started in minutes with our simple 4-step process
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Create Event</h3>
              <p>Set up your event details, add ticket types, and customize your page</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Sell Tickets</h3>
              <p>Start selling tickets instantly with our secure payment system</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Host Event</h3>
              <p>Manage check-ins with QR codes and engage with attendees</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Analyze Results</h3>
              <p>Get detailed insights into sales, attendance, and engagement</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">
              <span className="title-box title-box-border">Ready to</span>
              <span className="title-box title-box-filled">get started?</span>
            </h2>
            <p>
              Join thousands of event organizers who trust TickiSpot to deliver
              exceptional experiences
            </p>
            <div className="cta-buttons">
              {isLoggedIn ? (
                <Link to="/create" className="btn btn-primary btn-large">
                  Create Your First Event
                  <ArrowRight size={20} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-large">
                    Start Free Trial
                    <ArrowRight size={20} />
                  </Link>
                  <Link to="/events" className="btn btn-outline btn-large">
                    Browse Events
                  </Link>
                </>
              )}
            </div>
            <div className="cta-trust">
              <CheckCircle2 size={16} />
              <span>No credit card required</span>
              <span className="separator">·</span>
              <span>14-day free trial</span>
              <span className="separator">·</span>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Legal Pages */}
      <footer className="landing-footer">
        <div className="footer-wrapper">
          <div className="footer-content">
            <div className="footer-section footer-brand">
              <div className="footer-logo">
                <img src={icon} className="tickispot-icon" alt="TickiSpot" />
                <h3>TickiSpot</h3>
              </div>
              <p>
                Your complete event management solution. Create, manage, and
                grow your events with confidence.
              </p>
              <div className="footer-social">
                <a href="#" aria-label="Twitter">𝕏</a>
                <a href="#" aria-label="LinkedIn">in</a>
                <a href="#" aria-label="Instagram">📷</a>
              </div>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <Link to="/events">Browse Events</Link>
              <Link to="/create">Create Event</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/features">Features</Link>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <Link to="/help">Help Center</Link>
              <Link to="/contact">Contact Us</Link>
              <Link to="/about">About Us</Link>
              <Link to="/blog">Blog</Link>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/cookies">Cookie Policy</Link>
              <Link to="/donate">Donate</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 TickiSpot. All rights reserved.</p>
            <div className="footer-links">
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/sitemap">Sitemap</Link>
            </div>
          </div>
        </div>
        <ThemeToggle />
      </footer>
    </div>
  );
}