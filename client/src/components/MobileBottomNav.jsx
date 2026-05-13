import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Plus, Ticket, LayoutDashboard, LineChart, MessageCircle, X, Sparkles, CalendarPlus } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getCurrentUser } from "../utils/auth";
import CreateEvent from "../pages/CreateEvent";
import useFeatureAccess from "../hooks/useFeatureAccess";

const NAV_HEIGHT = 64; // px — keep in sync with the nav's actual rendered height

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

  // How far off-screen the entire layer slides when hidden
  const slideOffset = isVisible ? "translateY(0)" : `translateY(${NAV_HEIGHT}px)`;

  return (
    <>
      {/* ── Backdrop (separate from the sliding layer so it stays full-screen) ── */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/*
        ── Single sliding layer ───────────────────────────────────────────────
        Everything (FAB menu, FAB button, nav bar) lives inside this one div.
        It slides down together as a unit when hidden.
      */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          transform: slideOffset,
          transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* ── FAB Menu Items (sit above the nav bar) ── */}
        <div
          className="absolute right-4 flex flex-col items-end gap-3 pointer-events-none"
          style={{
            bottom: `${NAV_HEIGHT + 12}px`,
            transition: "opacity 200ms ease, transform 200ms ease",
            opacity: isMenuOpen ? 1 : 0,
            transform: isMenuOpen ? "translateY(0)" : "translateY(12px)",
            pointerEvents: isMenuOpen ? "auto" : "none",
          }}
        >
          {/* Ticki AI */}
          <div className="flex absolute items-center gap-2" style={{
    bottom: `${NAV_HEIGHT + 8 + 56}px`}}>
            <span className="text-xs font-semibold text-white bg-gray-900/80 backdrop-blur-sm px-2 py-1 rounded-full whitespace-nowrap">
              Ticki AI
            </span>
            <button
              onClick={handleAiClick}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg hover:scale-110 transition-transform duration-200 flex items-center justify-center flex-shrink-0"
            >
              <Sparkles size={22} />
            </button>
          </div>

          {/* Create Event */}
          <div className="flex absolute items-center gap-2" style={{
    bottom: `${NAV_HEIGHT}px`}}>
            <span className="text-xs font-semibold text-white bg-gray-900/80 backdrop-blur-sm px-2 py-1 rounded-full whitespace-nowrap">
              Create Event
            </span>
            <button
              onClick={() => {
                setShowCreateEvent(true);
                setIsMenuOpen(false);
              }}
              className="w-12 h-12 rounded-full bg-pink-500 text-white shadow-lg hover:scale-110 transition-transform duration-200 flex items-center justify-center flex-shrink-0"
            >
              <CalendarPlus size={22} />
            </button>
          </div>
        </div>

        {/* ── FAB Toggle Button (sits on top of the nav bar) ── */}
<button
  onClick={() => setIsMenuOpen((prev) => !prev)}
  className={`absolute right-4 w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center z-10 transition-all duration-300 ${
    isMenuOpen ? "bg-gray-800" : "bg-pink-500"
  }`}
  style={{ bottom: `${NAV_HEIGHT + 8}px` }}
  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
>
  <span
    style={{
      display: "flex",
      transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      transform: isMenuOpen ? "rotate(45deg)" : "rotate(0deg)",
    }}
  >
    {isMenuOpen ? <X size={26} /> : <Plus size={26} strokeWidth={2.5} />}
  </span>
</button>

        {/* ── Nav Bar ── */}
        <nav
          className="bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg"
          style={{ height: `${NAV_HEIGHT}px`, paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center justify-around h-full px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-center px-3 py-1.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "text-pink-500 bg-pink-50"
                      : "text-gray-500 hover:text-pink-500 hover:bg-pink-50/50"
                  }`}
                >
                  {item.icon}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <CreateEvent isOpen={showCreateEvent} onClose={() => setShowCreateEvent(false)} />
    </>
  );
}