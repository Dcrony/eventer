import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./CSS/landing.css";

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const heroSlides = [
    {
      title: "Create Unforgettable Events",
      subtitle:
        "From intimate gatherings to large-scale productions, bring your vision to life",
      image:
        "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Live Streaming & Real-time Chat",
      subtitle:
        "Connect with your audience globally through integrated live streaming",
      image:
        "https://cdn.pixabay.com/photo/2016/11/23/15/48/audience-1853662_1280.jpg",
    },
    {
      title: "Secure Ticketing & QR Codes",
      subtitle:
        "Streamlined ticket sales with instant QR code generation and secure payments",
      image:
        "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    },
  ];

  const features = [
    {
      icon: "🎫",
      title: "Smart Ticketing",
      description:
        "Create multiple ticket types, set pricing, and track sales in real-time",
    },
    {
      icon: "📱",
      title: "Live Streaming",
      description:
        "Integrate YouTube, Vimeo, or custom RTMP streams for virtual events",
    },
    {
      icon: "💬",
      title: "Live Chat",
      description:
        "Real-time audience engagement with moderated chat during events",
    },
    {
      icon: "📊",
      title: "Analytics Dashboard",
      description:
        "Comprehensive insights into ticket sales, audience engagement, and revenue",
    },
    {
      icon: "🔐",
      title: "Secure Payments",
      description:
        "Multiple payment gateways with instant confirmation and refund handling",
    },
    {
      icon: "📱",
      title: "Mobile Ready",
      description:
        "Fully responsive design that works perfectly on all devices",
    },
  ];

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <div className="logo">
            <h1>🎫 TickiSpot</h1>
          </div>
          <nav className="nav-menu">
            <Link to="/events" className="nav-link">
              Events
            </Link>
            <Link to="/about" className="nav-link">
              About
            </Link>
            <Link to="/contact" className="nav-link">
              Contact
            </Link>
            {isLoggedIn ? (
              <Link to="/dashboard" className="btn btn-primary">
                Dashboard
              </Link>
            ) : (
              <div className="lo">
                <Link to="/login" className="btn btn-primary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div
          className="hero-slide"
          style={{ backgroundImage: `url(${heroSlides[currentSlide].image})` }}
        >
          <div className="slide-content">
            <h1>{heroSlides[currentSlide].title}</h1>
            <p>{heroSlides[currentSlide].subtitle}</p>

            <div className="cta-buttons">
              {isLoggedIn ? (
                <>
                  <Link to="/dashboard" className="btn btn-primary">
                    Go to Dashboard
                  </Link>
                  <Link to="/events" className="btn btn-secondary">
                    Browse Events
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-primary">
                    Get Started
                  </Link>
                  <Link to="/register" className="btn btn-secondary">
                    Sign Up Free
                  </Link>
                  <Link to="/events" className="btn btn-outline">
                    Browse Events
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="slide-indicators">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Powerful Event Management Tools</h2>
          <p className="section-subtitle">
            Everything you need to create, manage, and monetize your events
          </p>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Create Your First Event?</h2>
          <p>Join thousands of event organizers who trust TickiSpot</p>
          <div className="cta-buttons">
            {isLoggedIn ? (
              <Link to="/create" className="btn btn-primary">
                Create Event
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">
                  Start Free Trial
                </Link>
                <Link to="/events" className="btn btn-outline">
                  Browse Events
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>🎫 TickiSpot</h3>
              <p>Your complete event management solution</p>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <Link to="/events">Browse Events</Link>
              <Link to="/create">Create Event</Link>
              <Link to="/pricing">Pricing</Link>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <Link to="/help">Help Center</Link>
              <Link to="/contact">Contact Us</Link>
              <Link to="/docs">Documentation</Link>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <Link to="/about">About Us</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 TickiSpot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
