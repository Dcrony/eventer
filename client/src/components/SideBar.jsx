import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { logout, getCurrentUser } from "../utils/auth";
import CreateEvent from "../pages/CreateEvent";
import NotificationBell from "./NotificationBell";
import MessageIndicator from "./MessageIndicator";
import "./css/sidebar.css";
import icon from "../assets/icon.svg";

import {
  LayoutDashboard,
  Calendar,
  LineChart,
  Ticket,
  Radio,
  PlusCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  MessageSquare,
  Banknote,
  DollarSign,
  Shield,
} from "lucide-react";

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [expand, setexpand] = useState(false);
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

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      expand ? "15rem" : "5rem"
    );
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width");
    };
  }, [expand]);

  if (!user) return null;

  const isAdmin = user?.role === "admin" || user?.isAdmin === true;
  const isOranizer = user?.role === "organizer" || user?.isOrganizer === true;
  const canOrganize = isAdmin || isOranizer;
  const isFreeUser = user?.plan?.toLowerCase() === "free" || !user?.plan;

  const menuItems = [
    ...(isAdmin
      ? [{ to: "/admin/dashboard", label: "Admin", icon: <Shield size={20} /> }]
      : []),
    ...(canOrganize
      ? [{ to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> }]
      : []),
    { to: "/events", label: "Events", icon: <Calendar size={20} /> },
    { to: "/my-tickets", label: "My Tickets", icon: <Ticket size={20} /> },
    ...(isFreeUser
      ? [{ to: "/pricing", label: "Premium", icon: <DollarSign size={20} /> }]
      : []),

    ...(canOrganize
      ? [{
        label: "Create",
        icon: <PlusCircle size={20} />,
        action: () => setShowCreateEvent(true),
        primary: true,
      }]
      : []),
    { to: "/analytics", label: "Analytics", icon: <LineChart size={20} /> },
    ...(canOrganize
      ? [{ to: "/earnings", label: "Earnings", icon: <Banknote size={20} /> }]
      : []),


    { to: "/messages", label: "Messages", icon: <MessageSquare size={20} />, component: MessageIndicator },
    { to: "/live/events", label: "Live", icon: <Radio size={20} /> },


  ];

  const profileUrl = `/users/${user?.id ?? user?._id ?? ""}`;

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  return (
    <>
      <aside className={`sidebar ${expand ? "expand" : ""}`}>
        {/* HEADER: Fixed */}
        <div className="sidebar-top">
          <Link to="/" className="sidebar-brand">
            <div className="sidebar-logo">
              <img src={icon} alt="Logo" />
            </div>
            {expand && <span className="sidebar-brand-text">TickiSpot</span>}
          </Link>
          <button onClick={() => setexpand(!expand)} className="sidebar-collapse" aria-label="Toggle Sidebar">
            {expand ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* MIDDLE: Scrollable */}
        <div className="sidebar-content">
          <nav className="sidebar-nav">
            {menuItems.map((item, idx) => {
              const isActive = location.pathname === item.to;

              if (item.component) {
                const Component = item.component;
                return (
                  <Link key={idx} to={item.to} className={`sidebar-link ${isActive ? "is-active" : ""}`} title={!expand ? item.label : ""}>
                    <span className="sidebar-link-icon"><Component /></span>
                    {expand && <span className="sidebar-link-text">{item.label}</span>}
                  </Link>
                );
              }

              return item.action ? (
                <button key={idx} onClick={item.action} className={`sidebar-link ${item.primary ? "is-primary" : ""}`} title={!expand ? item.label : ""}>
                  <span className="sidebar-link-icon">{item.icon}</span>
                  {expand && <span className="sidebar-link-text">{item.label}</span>}
                </button>
              ) : (
                <Link key={idx} to={item.to} className={`sidebar-link ${isActive ? "is-active" : ""}`} title={!expand ? item.label : ""}>
                  <span className="sidebar-link-icon">{item.icon}</span>
                  {expand && <span className="sidebar-link-text">{item.label}</span>}
                </Link>
              );
            })}
            <div className="sidebar-link notification-wrapper">
              <NotificationBell />
              {expand && <span className="sidebar-link-text">Notifications</span>}
            </div>

            <Link to={profileUrl} className="sidebar-link" title={!expand ? "Profile" : ""}>
              <span className="sidebar-link-icon"><User size={20} /></span>
              {expand && <span className="sidebar-link-text">Profile</span>}
            </Link>

            <Link to="/settings" className="sidebar-link" title={!expand ? "Settings" : ""}>
              <span className="sidebar-link-icon"><Settings size={20} /></span>
              {expand && <span className="sidebar-link-text">Settings</span>}
            </Link>

            <button onClick={handleLogout} className="sidebar-link is-logout" title={!expand ? "Logout" : ""}>
              <span className="sidebar-link-icon"><LogOut size={20} /></span>
              {expand && <span className="sidebar-link-text">Logout</span>}
            </button>
          </nav>
        </div>


      </aside>

      <CreateEvent isOpen={showCreateEvent} onClose={() => setShowCreateEvent(false)} />
    </>
  );
}