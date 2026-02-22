import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Home, PlusCircle, Ticket, User, Menu } from "lucide-react";
import "./css/mobileNav.css";

import { getCurrentUser } from "../utils/auth";
import { useEffect, useState } from "react";

export default function MobileBottomNav() {
  const location = useLocation();
  const [user, setUser] = useState(null);

useEffect(() => {
  const currentUser = getCurrentUser();
  if (currentUser) setUser(currentUser);
}, []);

  const navItems = [
  { to: "/dashboard", icon: <LayoutDashboard size={22} />, label: "Dashboard" },
  { to: "/events", icon: <Home size={22} />, label: "Events" },
  { to: "/create", icon: <PlusCircle size={26} />, label: "Create", primary: true },
  { to: "/my-tickets", icon: <Ticket size={22} />, label: "Tickets" },
  { to: "/more", icon: <Menu size={22} />, label: "More" },
];

  return (
    <div className="mobile-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;

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
  );
}