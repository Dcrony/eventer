import { Link, useLocation } from "react-router-dom";
import { Home, Plus, Ticket, LayoutDashboard, LineChart, MessageCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getCurrentUser } from "../utils/auth";
import CreateEvent from "../pages/CreateEvent";
import "./css/mobileNav.css";

export default function MobileBottomNav() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  
  // Scroll visibility state
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) setUser(currentUser);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // If scrolling down and scrolled more than 10px, hide
      if (currentScrollY > lastScrollY.current && currentScrollY > 10) {
        setIsVisible(false);
      } 
      // If scrolling up, show
      else {
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!user) return null;

  const isAdmin = user?.role === "admin" || user?.isAdmin === true;
  const isOrganizer = user?.role === "organizer" || user?.isOrganizer === true;
  const canOrganize = isAdmin || isOrganizer;

  const navItems = [
    ...(canOrganize
      ? [{ to: "/dashboard", icon: <LayoutDashboard size={24} /> }]
      : []),
    { to: "/events", icon: <Home size={24} /> },
    { to: "/my-tickets", icon: <Ticket size={24} /> },
    { to: "/analytics", icon: <LineChart size={24} /> },
    { to: "/messages", icon: <MessageCircle size={24} /> },
  ];

  return (
    <div className={`mobile-nav-wrapper ${isVisible ? "nav-visible" : "nav-hidden"}`}>
      {/* Floating Create Button */}
      <button 
        className="x-fab-btn" 
        onClick={() => setShowCreateEvent(true)}
        aria-label="Create New"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Bottom Bar */}
      <nav className="x-bottom-bar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link 
              key={item.to} 
              to={item.to} 
              className={`x-nav-item ${isActive ? "active" : ""}`}
            >
              <div className="icon-container">
                {item.icon}
                {item.to === "/notifications" && <span className="x-badge" />}
              </div>
            </Link>
          );
        })}
      </nav>

      <CreateEvent
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
      />
    </div>
  );
}