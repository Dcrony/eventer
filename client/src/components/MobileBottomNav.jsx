import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Plus, Ticket, LayoutDashboard, LineChart, MessageCircle, X, Sparkles, CalendarPlus } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getCurrentUser } from "../utils/auth";
import CreateEvent from "../pages/CreateEvent";
import useFeatureAccess from "../hooks/useFeatureAccess";

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const { hasAccess: canAI, promptUpgrade: promptAI } = useFeatureAccess("tickiai");
  
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
    ...(canOrganize ? [{ to: "/dashboard", icon: <LayoutDashboard size={22} /> }] : []),
    { to: "/events", icon: <Home size={22} /> },
    { to: "/my-tickets", icon: <Ticket size={22} /> },
    { to: "/analytics", icon: <LineChart size={22} /> },
    { to: "/messages", icon: <MessageCircle size={22} /> },
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
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* FAB Menu Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-200"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* FAB Menu Items */}
      <div
        className={`absolute bottom-20 right-4 flex flex-col gap-3 transition-all duration-300 transform z-50 ${
          isMenuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-8 pointer-events-none"
        }`}
      >
        {/* AI Button */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold text-white bg-gray-900/80 backdrop-blur-sm px-2 py-1 rounded-full transition-all duration-200 ${
            isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
          }`}>
            Ticki AI
          </span>
          <button
            onClick={handleAiClick}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center"
          >
            <Sparkles size={22} />
          </button>
        </div>

        {/* Create Event Button */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold text-white bg-gray-900/80 backdrop-blur-sm px-2 py-1 rounded-full transition-all duration-200 ${
            isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
          }`}>
            Create Event
          </span>
          <button
            onClick={() => {
              setShowCreateEvent(true);
              setIsMenuOpen(false);
            }}
            className="w-12 h-12 rounded-full bg-pink-500 text-white shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center"
          >
            <CalendarPlus size={22} />
          </button>
        </div>
      </div>

      {/* Main FAB Toggle Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`absolute bottom-14 right-4 w-14 h-14 rounded-full bg-pink-500 text-white shadow-xl transition-all duration-300 flex items-center justify-center z-50 ${
          isMenuOpen ? "rotate-45 bg-gray-800" : "rotate-0"
        }`}
      >
        {isMenuOpen ? <X size={26} /> : <Plus size={26} strokeWidth={2.5} />}
      </button>

      {/* Bottom Navigation Bar */}
      <nav
        className={`bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-pink-500 bg-pink-50"
                    : "text-gray-500 hover:text-pink-500 hover:bg-pink-50/50"
                }`}
              >
                <div className="icon-container">{item.icon}</div>
              </Link>
            );
          })}
        </div>
      </nav>

      <CreateEvent isOpen={showCreateEvent} onClose={() => setShowCreateEvent(false)} />
    </div>
  );
}