import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Home, PlusCircle, Ticket, User, Menu } from "lucide-react";
import "./css/mobileNav.css";
import { getCurrentUser } from "../utils/auth";
import { useEffect, useState } from "react";
import CreateEvent from "../pages/CreateEvent"; // Import the modal

export default function MobileBottomNav() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false); // Add state for modal

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) setUser(currentUser);
  }, []);

  // Don't show mobile nav if user is not logged in
  if (!user) {
    return null;
  }

  const navItems = [
    { to: "/dashboard", icon: <LayoutDashboard size={22} />, label: "Dashboard" },
    { to: "/events", icon: <Home size={22} />, label: "Events" },
    { 
      icon: <PlusCircle size={26} />, 
      label: "Create", 
      primary: true,
      action: () => setShowCreateEvent(true), // Add action to open modal
      isButton: true // Flag to identify this as a button, not a link
    },
    { to: "/my-tickets", icon: <Ticket size={22} />, label: "Tickets" },
    { to: "/more", icon: <Menu size={22} />, label: "More" },
  ];

  return (
    <>
      <div className="mobile-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;

          // If it's a button (like Create), render a button instead of Link
          if (item.isButton) {
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={`mobile-nav-item ${item.primary ? "primary" : ""}`}
                type="button"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          }

          // Otherwise render as Link
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`mobile-nav-item ${isActive ? "active" : ""} ${item.primary ? "primary" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Add the CreateEvent modal */}
      <CreateEvent
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
      />
    </>
  );
}
