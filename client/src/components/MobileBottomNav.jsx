import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Home, PlusCircle, Ticket, Bell, MessageCircle, LineChart, Users } from "lucide-react";
import "./css/mobileNav.css";
import { getCurrentUser } from "../utils/auth";
import { useEffect, useState } from "react";
import CreateEvent from "../pages/CreateEvent";

export default function MobileBottomNav() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) setUser(currentUser);
  }, []);

  // Don't show mobile nav if user is not logged in
  if (!user) {
    return null;
  }

  const canOrganize =
    user?.role === "organizer" || user?.isOrganizer === true || user?.role === "admin";

  const navItems = [
    ...(canOrganize
      ? [{ to: "/dashboard", icon: <LayoutDashboard size={22} />, label: "Dashboard" }]
      : []),
    { to: "/events", icon: <Home size={22} />, label: "Events" },
    { to: "/my-tickets", icon: <Ticket size={22} />, label: "Tickets" },
    { to: "/analytics", icon: <LineChart size={22} />, label: "Analytics" },
    { to: "/community", icon: <Users size={22} />, label: "Community" },
    { to: "/messages", icon: <MessageCircle size={22} />, label: "Messages" },
  ];

  // Create button component (positioned outside the main nav)
  const CreateButton = () => (
    <button
      onClick={() => setShowCreateEvent(true)}
      className="mobile-create-btn"
      aria-label="Create event"
    >
      <PlusCircle size={28} />
    </button>
  );

  return (
    <>
      {/* Floating Create Button - Positioned on the left side like X/Twitter */}
      <CreateButton />

      {/* Bottom Navigation Bar */}
      <div className="mobile-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;

          return (
            <Link
              key={item.label}
              to={item.to}
              className={`mobile-nav-item ${isActive ? "active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Create Event Modal */}
      <CreateEvent
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
      />
    </>
  );
}