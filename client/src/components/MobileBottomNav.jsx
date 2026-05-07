import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Plus, Ticket, LayoutDashboard, LineChart, MessageCircle, X, Sparkles, CalendarPlus } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getCurrentUser } from "../utils/auth";
import CreateEvent from "../pages/CreateEvent";
import useFeatureAccess from "../hooks/useFeatureAccess";
import "./css/mobileNav.css";

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  
  const { hasAccess: canAI, promptUpgrade: promptAI } = useFeatureAccess("tickiai");

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsVisible(false);
        setIsMenuOpen(false); 
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide the entire bottom nav when on the AI page to give it a "full page" feel
  const isAiPage = location.pathname === "/ticki-ai";
  if (!user || isAiPage) return null;

  const isAdmin = user?.role === "admin" || user?.isAdmin === true;
  const isOrganizer = user?.role === "organizer" || user?.isOrganizer === true;
  const canOrganize = isAdmin || isOrganizer;

  const navItems = [
    ...(canOrganize ? [{ to: "/dashboard", icon: <LayoutDashboard size={24} /> }] : []),
    { to: "/events", icon: <Home size={24} /> },
    { to: "/my-tickets", icon: <Ticket size={24} /> },
    { to: "/analytics", icon: <LineChart size={24} /> },
    { to: "/messages", icon: <MessageCircle size={24} /> },
  ];

  const handleAiClick = () => {
    if (!canAI) {
      promptAI();
      return;
    }
    setIsMenuOpen(false);
    navigate("/ticki-ai");
  };

  return (
    <div className={`mobile-nav-wrapper ${isVisible ? "nav-visible" : "nav-hidden"}`}>
      
      {/* Menu Backdrop */}
      {isMenuOpen && <div className="fab-overlay" onClick={() => setIsMenuOpen(false)} />}

      {/* FAB Menu Items */}
      <div className={`fab-menu-items ${isMenuOpen ? "open" : ""}`}>
        <div className="fab-item-group">
          <span className="fab-label">Ticki AI</span>
          <button className="fab-sub-btn ai-btn" onClick={handleAiClick}>
            <Sparkles size={20} />
          </button>
        </div>
        
        <div className="fab-item-group">
          <span className="fab-label">Create Event</span>
          <button className="fab-sub-btn create-btn" onClick={() => { 
            setShowCreateEvent(true); 
            setIsMenuOpen(false); 
          }}>
            <CalendarPlus size={20} />
          </button>
        </div>
      </div>

      {/* Main FAB Toggle */}
      <button 
        className={`x-fab-btn ${isMenuOpen ? "active" : ""}`} 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X size={28} /> : <Plus size={28} strokeWidth={2.5} />}
      </button>

      {/* Bottom Bar */}
      <nav className="x-bottom-bar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} className={`x-nav-item ${isActive ? "active" : ""}`}>
              <div className="icon-container">{item.icon}</div>
            </Link>
          );
        })}
      </nav>

      <CreateEvent isOpen={showCreateEvent} onClose={() => setShowCreateEvent(false)} />
    </div>
  );
}
