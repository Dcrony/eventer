import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./CSS/landing.css";
import { useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContexts";
import icon from "../assets/icon.svg";
import useInstallPrompt from "../hooks/useInstallPrompt";


import {
  TicketCheck,
  ToggleLeft,
  ToggleRight,
  Shield,
  BarChart3,
  Smartphone,
  Video,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Star,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

import LandingNavbar from "../components/LandingNavbar";
import Footer from "../components/Footer";

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { canInstall, install } = useInstallPrompt();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

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

    // Observe all animatable elements
    const elements = document.querySelectorAll(
      ".stat-item, .feature-card, .testimonial-card, .section-header",
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

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
    },
    {
      name: "Michael Chen",
      role: "Marketing Director",
      company: "Music Festivals Inc",
      content:
        "The live streaming integration is seamless. Our virtual events have never been smoother.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Conference Manager",
      company: "Business Connect",
      content:
        "The ticketing system is intuitive and our attendees love the QR code check-in process.",
      rating: 5,
    },
  ];

  const stats = [
    { number: "10K+", label: "Events Created" },
    { number: "500K+", label: "Tickets Sold" },
    { number: "50K+", label: "Active Users" },
    { number: "99.9%", label: "Uptime" },
  ];

  return (
    <div className="landing-page">
      {/* Grid Background */}
      <div className="grid-background"></div>

      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <Link to="/" className="logo">
            <img src={icon} className="tickispot-icon" />

            <h1>TickiSpot</h1>
          </Link>
          <nav className="nav-menu">
            <Link to="/events" className="nav-link">
              Events
            </Link>
            <Link to="/pricing" className="nav-link">
              Pricing
            </Link>
            <Link to="/about" className="nav-link">
              About
            </Link>
            <Link to="/contact" className="nav-link">
              Contact
            </Link>
            {canInstall && (
                    <button
                      onClick={install}
                      className="px-3 py-1 rounded-lg bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 transition"
                    >
                      Install App
                    </button>
                  )}
            {isLoggedIn ? (
              <Link to="/dashboard" className="btn btn-primary">
                Dashboard
              </Link>
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
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text-container">
            <div className="hero-title-wrapper">
              <span className="hero-text-box hero-text-border">Discover</span>
              <span className="hero-text-box hero-text-filled">events</span>
            </div>
            <div className="hero-subtitle-wrapper">
              <span className="hero-text-box hero-text-border">near</span>
              <span className="hero-text-box hero-text-filled">you</span>
            </div>
            <p className="hero-description">
              Explore popular events near you, browse by category, or check out
              some of the great community calendars.
            </p>
            <div className="hero-cta">
              {isLoggedIn ? (
                <>
                  <Link to="/dashboard" className="btn btn-primary btn-large">
                    Go to Dashboard
                    <ArrowRight size={20} />
                  </Link>
                  <Link to="/events" className="btn btn-secondary btn-large">
                    Browse Events
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-large">
                    Get Started
                    <ArrowRight size={20} />
                  </Link>
                  <Link to="/events" className="btn btn-secondary btn-large">
                    Browse Events
                  </Link>
                  
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="stat-item"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
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

      {/* Testimonials */}
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
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <p className="testimonial-content">"{testimonial.content}"</p>
                <div className="testimonial-author">
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

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-wrapper">
          <div className="footer-content">
            <div className="footer-section footer-brand">
              <div className="footer-logo">
                <img src={icon} className="tickispot-icon" />

                <h3>TickiSpot</h3>
              </div>
              <p>
                Your complete event management solution. Create, manage, and
                grow your events with confidence.
              </p>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <Link to="/events">Browse Events</Link>
              <Link to="/create">Create Event</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/docs">Documentation</Link>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <Link to="/help">Help Center</Link>
              <Link to="/contact">Contact Us</Link>
              <Link to="/about">About Us</Link>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/donate">Donate</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 TickiSpot. All rights reserved.</p>
            <div className="footer-links">
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
