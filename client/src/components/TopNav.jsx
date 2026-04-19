import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  Settings,
  Ticket,
  Calendar,
  Heart,
  LogOut,
  ChevronRight,
  BarChart3,
  HelpCircle,
  Banknote,
  Users,
  DollarSign,
  Bell,
  ChevronsRight,
} from "lucide-react";

import { logout } from "../utils/auth";
import { useAuth } from "../context/AuthContext";
import { getProfileImageUrl } from "../utils/eventHelpers";
import NotificationBell from "./NotificationBell";
import "./css/TopNav.css";
import Avatar from "./ui/avatar";

export default function TopNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin" || user?.isAdmin;
  const isOrganizer = user?.role === "organizer" || user?.isOrganizer;

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    if (window.confirm("Logout from your account?")) {
      logout();
      navigate("/login");
      setIsMenuOpen(false);
    }
  };

  const goToProfile = () => {
    if (!user) return;
    navigate(`/profile/${user._id || user.id}`);
    setIsMenuOpen(false);
  };


  return (
    <>
      {/* TOP BAR */}
      <div className="top-nav">
        <div className="top-nav-container">
          {/* Avatar button */}
          <div
            className="top-nav-more-btn"
            onClick={() => setIsMenuOpen(true)}
          >
              <Avatar src={user ? getProfileImageUrl(user) : null} name={user?.name || user?.username || "Account"} className="avatar-small" />
              <ChevronsRight size={14} className="dropdown-icon" />
          </div>

          <Link to="/" className="top-nav-logo">
            <span className="logo-text">TickiSpot</span>
          </Link>

          <NotificationBell />
        </div>
      </div>

      {/* SLIDE MENU */}
      <div className={`slide-menu ${isMenuOpen ? "open" : ""}`}>
        {/* HEADER */}
        <div className="slide-menu-header">
          <div className="slide-menu-header-content">
            <h3>Menu</h3>
            <button type="button" onClick={closeMenu}>
              <X size={24} />
            </button>
          </div>

          {/* USER PROFILE CLICK */}
          {user && (
            <div className="slide-menu-user clickable" onClick={goToProfile}>
              <div className="slide-menu-avatar">
                <Avatar src={getProfileImageUrl(user)} name={user.name || user.username} />
              </div>

              <div className="slide-menu-user-info">
                <h4>{user.name}</h4>
                <p>@{user.username}</p>
              </div>

              <ChevronRight size={16} />
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="slide-menu-content">

          {/* CORE */}
          <div className="slide-menu-section">
            <h4>My Activity</h4>

            <Link to="/my-tickets" className="slide-menu-item" onClick={closeMenu}>
              <Ticket size={18} />
              <span>My Tickets</span>
              <ChevronRight size={16} />
            </Link>

            <Link to="/favorites" className="slide-menu-item" onClick={closeMenu}>
              <Heart size={18} />
              <span>Favorites</span>
              <ChevronRight size={16} />
            </Link>

            <Link to="/notifications" className="slide-menu-item" onClick={closeMenu}>
              <Bell size={18} />
              <span>Notifications</span>
              <ChevronRight size={16} />
            </Link>

            <Link to="/events" className="slide-menu-item" onClick={closeMenu}>
              <Calendar size={18} />
              <span>Events</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* ACCOUNT */}
          <div className="slide-menu-section">
            <h4>Account</h4>

            <Link to="/settings" className="slide-menu-item" onClick={closeMenu}>
              <Settings size={18} />
              <span>Settings</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* CREATOR */}
          {(isOrganizer || isAdmin) && (
            <div className="slide-menu-section">
              <h4>Creator</h4>

              {isOrganizer && (
                <>
                  <Link to="/dashboard" className="slide-menu-item" onClick={closeMenu}>
                    <BarChart3 size={18} />
                    <span>Dashboard</span>
                    <ChevronRight size={16} />
                  </Link>
                  <Link to="/earnings" className="slide-menu-item" onClick={closeMenu}>
                    <Banknote size={18} />
                    <span>Earnings</span>
                    <ChevronRight size={16} className="menu-arrow" />
                  </Link>
                  <Link to="/create-event" className="slide-menu-item" onClick={closeMenu}>
                    <Calendar size={18} />
                    <span>Create Event</span>
                    <ChevronRight size={16} />
                  </Link>

                  <Link to="/analytics" className="slide-menu-item" onClick={closeMenu}>
                    <BarChart3 size={18} />
                    <span>Analytics</span>
                    <ChevronRight size={16} />
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link to="/admin/users" className="slide-menu-item" onClick={closeMenu}>
                    <Users size={18} />
                    <span>User Management</span>
                    <ChevronRight size={16} className="menu-arrow" />
                  </Link>
                  <Link to="/admin/withdrawals" className="slide-menu-item" onClick={closeMenu}>
                    <DollarSign size={18} />
                    <span>Withdrawals</span>
                    <ChevronRight size={16} className="menu-arrow" />
                  </Link>
                </>
              )}
            </div>
          )}

          {/* SUPPORT */}
          <div className="slide-menu-section">
            <h4>Support</h4>

            <Link to="/help" className="slide-menu-item" onClick={closeMenu}>
              <HelpCircle size={18} />
              <span>Help</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* LOGOUT */}
          <div className="slide-menu-section">
            <button type="button" onClick={handleLogout} className="slide-menu-item logout">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* OVERLAY */}
      {isMenuOpen && (
        <div
          className="slide-menu-overlay"
          onClick={closeMenu}
        />
      )}
    </>
  );
}
