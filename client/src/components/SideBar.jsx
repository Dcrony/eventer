import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContexts";
import { logout, getCurrentUser } from "../utils/auth";
import CreateEvent from "../pages/CreateEvent";
import NotificationBell from "./NotificationBell";
import "./css/sidebar.css";
import icon from "../assets/icon.svg"

import {
  LayoutDashboard,
  Home,
  BarChart3,
  Ticket,
  Radio,
  PlusCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Bell,
} from "lucide-react";

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [expand, setexpand] = useState(false);
  const { darkMode } = useContext(ThemeContext);
  const location = useLocation();
  const [showCreateEvent, setShowCreateEvent] = useState(false); 
  

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) setUser(currentUser);

    const savedexpand = localStorage.getItem("sidebarexpand");
    if (savedexpand !== null) {
      setexpand(savedexpand === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarexpand", expand);
  }, [expand]);

  // Keep shell padding in sync with sidebar width
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      expand ? "15rem" : "4rem"
    );
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width");
    };
  }, [expand]);

  if (!user) return null;

  const isAdmin = user?.role === "admin" || user?.isAdmin === true;
  const isOranizer = user?.role === "organizer" || user?.isOrganizer === true;

  const canOrganize = isAdmin || isOranizer;

  const menuItems = [
  ...(canOrganize
    ? [{ to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> }]
    : []),

  { to: "/events", label: "Home", icon: <Home size={20} /> },

  ...(isAdmin
    ? [{ to: "/admin/dashboard", label: "Stats", icon: <BarChart3 size={20} /> }]
    : []),

  { to: "/my-tickets", label: "My Tickets", icon: <Ticket size={20} /> },
  { to: "/live/events", label: "Live", icon: <Radio size={20} /> },

  ...(canOrganize
    ? [{
        label: "Create",
        icon: <PlusCircle size={20} />,
        action: () => setShowCreateEvent(true),
        primary: true,
      }]
    : []),
];

  const profileUrl = `/users/${user?.id ?? user?._id ?? ""}`;

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  return (
    <>
      <div
        className={`sidebar h-screen transition-all duration-300 ${expand ? "expand" : ""
          } ${darkMode ? "dark-mode" : ""}`}
      >
        <div className="sidebar-top">
          <Link to="/" className="sidebar-brand" aria-label="TickiSpot home">
            <span className="sidebar-logo">
              <img src={icon} alt="" />
            </span>
            {expand && <span className="sidebar-brand-text">TickiSpot</span>}
          </Link>

          <button
            onClick={() => setexpand(!expand)}
            className="sidebar-collapse"
            aria-label={expand ? "Collapse sidebar" : "Expand sidebar"}
            type="button"
          >
            {expand ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Sidebar Links */}
        <div className="sidebar-nav">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;

            return item.action ? (
              // ✅ Handle buttons like Create (not routes)
              <button
                key={item.label}
                onClick={item.action}
                className={`sidebar-link ${item.primary ? "is-primary" : ""}`}
                data-tooltip={item.label}
                type="button"
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {expand && <span className="sidebar-link-text">{item.label}</span>}
              </button>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-link ${isActive ? "is-active" : ""}`}
                data-tooltip={item.label}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {expand && <span className="sidebar-link-text">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="sidebar-divider" />

        {/* Bottom: Notifications first, then Profile, Settings, Logout */}
        <div className="sidebar-bottom">
          <div className="sidebar-bottom-item" data-tooltip="Notifications">
            <NotificationBell userId={user.id} />
          </div>
          <Link
            to={profileUrl}
            className={`sidebar-link ${location.pathname === profileUrl ? "is-active" : ""}`}
            data-tooltip="Profile"
          >
            <span className="sidebar-link-icon"><User size={20} /></span>
            {expand && <span className="sidebar-link-text">Profile</span>}
          </Link>
          <Link
            to="/settings"
            className={`sidebar-link ${location.pathname === "/settings" ? "is-active" : ""}`}
            data-tooltip="Settings"
          >
            <span className="sidebar-link-icon"><Settings size={20} /></span>
            {expand && <span className="sidebar-link-text">Settings</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="sidebar-link is-logout"
            data-tooltip="Logout"
            type="button"
          >
            <span className="sidebar-link-icon">
              <LogOut size={20} />
            </span>
            {expand && <span className="sidebar-link-text">Logout</span>}
          </button>
        </div>
      </div>

      {/* ✅ Create Event Modal */}
      <CreateEvent
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
      />
    </>
  );
}
