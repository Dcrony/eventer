import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { logout, getCurrentUser } from "../utils/auth";
import { useCreateEvent } from "../context/CreateEventContext";
import NotificationBell from "./NotificationBell";
import MessageIndicator from "./MessageIndicator";
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
  Heart,
  CreditCard,
  Users,
} from "lucide-react";

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [expand, setExpand] = useState(false);
  const location = useLocation();
  const { openCreateEvent } = useCreateEvent();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) setUser(currentUser);

    const savedExpand = localStorage.getItem("sidebarexpand");
    if (savedExpand !== null) {
      setExpand(savedExpand === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarexpand", expand);
    document.documentElement.style.setProperty("--sidebar-width", expand ? "15rem" : "5rem");
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width");
    };
  }, [expand]);

  if (!user) return null;

  const isAdmin = user?.role === "admin" || user?.isAdmin === true;
  const isOrganizer = user?.role === "organizer" || user?.isOrganizer === true;
  const canOrganize = isAdmin || isOrganizer;
  const isFreeUser = user?.plan?.toLowerCase() === "free" || !user?.plan;

  const menuItems = [
    ...(isAdmin ? [{ to: "/admin/dashboard", label: "Admin", icon: <Shield size={20} /> }] : []),
    ...(canOrganize ? [{ to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> }] : []),
    { to: "/events", label: "Events", icon: <Calendar size={20} /> },
    { to: "/my-tickets", label: "My Tickets", icon: <Ticket size={20} /> },
    ...(isFreeUser ? [{ to: "/pricing", label: "Premium", icon: <DollarSign size={20} /> }] : []),
    ...(canOrganize ? [{
      label: "Create",
      icon: <PlusCircle size={20} />,
      action: () => openCreateEvent(),
      primary: true,
    }] : []),
    { to: "/community", label: "Community", icon: <MessageSquare size={20} /> },
    { to: "/favorites", label: "Favorites", icon: <Heart size={20} /> },
    { to: "/billing", label: "Billing", icon: <CreditCard size={20} /> },
    { to: "/team/invitations", label: "Team", icon: <Users size={20} /> },
    { to: "/analytics", label: "Analytics", icon: <LineChart size={20} /> },
    ...(canOrganize ? [{ to: "/earnings", label: "Earnings", icon: <Banknote size={20} /> }] : []),
    { to: "/messages", label: "Messages", icon: <MessageSquare size={20} />, component: MessageIndicator },
    { to: "/live/events", label: "Live", icon: <Radio size={20} /> },
  ];

  const profileUrl = user?.username
    ? `/user/${user.username}`
    : "/profile/me";

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-40 transition-all duration-300 flex flex-col ${
          expand ? "w-60" : "w-20"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src={icon} alt="Logo" className="w-7 h-7" />
            </div>
            {expand && <span className="text-base font-extrabold text-gray-900">TickiSpot</span>}
          </Link>
          <button
            onClick={() => setExpand(!expand)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-pink-500 transition-all duration-200"
            aria-label="Toggle Sidebar"
          >
            {expand ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 scrolling-touch scrollbar-thin">
          <nav className="space-y-1 px-2">
            {menuItems.map((item, idx) => {
              const isActive = location.pathname === item.to;

              if (item.component) {
                const Component = item.component;
                return (
                  <Link
                    key={idx}
                    to={item.to}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-pink-50 text-pink-500"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    title={!expand ? item.label : ""}
                  >
                    <span className="flex-shrink-0">
                      <Component />
                    </span>
                    {expand && <span className="text-sm font-semibold">{item.label}</span>}
                  </Link>
                );
              }

              if (item.action) {
                return (
                  <button
                    key={idx}
                    onClick={item.action}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 w-full ${
                      item.primary
                        ? "bg-pink-500 text-white shadow-md shadow-pink-500/25 hover:bg-pink-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    title={!expand ? item.label : ""}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {expand && <span className="text-sm font-semibold">{item.label}</span>}
                  </button>
                );
              }

              return (
                <Link
                  key={idx}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-pink-50 text-pink-500"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  title={!expand ? item.label : ""}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {expand && <span className="text-sm font-semibold">{item.label}</span>}
                </Link>
              );
            })}

            {/* Notifications */}
            <div className="flex items-center gap-3 px-2 py-2.5 text-gray-600">
              <span className="flex-shrink-0">
                <NotificationBell />
              </span>
              {expand && <span className="text-sm font-semibold">Notifications</span>}
            </div>

            {/* Profile */}
            <Link
              to={profileUrl}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              title={!expand ? "Profile" : ""}
            >
              <span className="flex-shrink-0"><User size={20} /></span>
              {expand && <span className="text-sm font-semibold">Profile</span>}
            </Link>

            {/* Settings */}
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              title={!expand ? "Settings" : ""}
            >
              <span className="flex-shrink-0"><Settings size={20} /></span>
              {expand && <span className="text-sm font-semibold">Settings</span>}
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-50 w-full"
              title={!expand ? "Logout" : ""}
            >
              <span className="flex-shrink-0"><LogOut size={20} /></span>
              {expand && <span className="text-sm font-semibold">Logout</span>}
            </button>
          </nav>
        </div>

        {expand && user && (
          <div className="p-4 border-t border-gray-100 mt-auto">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-pink-600">
                  {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{user.name || user.username}</p>
                <p className="text-[0.6rem] text-gray-400 capitalize">{user.plan || "free"} plan</p>
              </div>
            </div>
          </div>
        )}
      </aside>

        <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: 2px;
        }
      `}</style>
    </>
  );
}