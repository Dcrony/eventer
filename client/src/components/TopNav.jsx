import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  User,
  Settings,
  Ticket,
  Calendar,
  Heart,
  LogOut,
  ChevronRight,
  BarChart3,
  HelpCircle,
  ChevronDown,
  ChevronsRight,
} from "lucide-react";

import { logout } from "../utils/auth";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import "./css/TopNav.css";
import Avatar from "./ui/avatar";

export default function TopNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin" || user?.isAdmin;
  const isOrganizer = user?.role === "organizer" || user?.isOrganizer;

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
            {user?.profilePic ? (
              <div className="profile-dropdown">
                        <Avatar src={user?.profilePic} name={user?.name || user?.username} className="avatar-small" />
                        <ChevronsRight size={14} className="dropdown-icon" />
                      </div>
            ) : (
              <div className="avatar-placeholder">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
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
            <button onClick={() => setIsMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>

          {/* USER PROFILE CLICK */}
          {user && (
            <div className="slide-menu-user clickable" onClick={goToProfile}>
              <div className="slide-menu-avatar">
                {user.profilePic ? (
                  <img src={user.profilePic} />
                ) : (
                  <div className="avatar-placeholder">
                    {user.name?.charAt(0)}
                  </div>
                )}
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

            <Link to="/my-tickets" className="slide-menu-item">
              <Ticket size={18} />
              <span>My Tickets</span>
              <ChevronRight size={16} />
            </Link>

            <Link to="/favorites" className="slide-menu-item">
              <Heart size={18} />
              <span>Favorites</span>
              <ChevronRight size={16} />
            </Link>

            <Link to="/events" className="slide-menu-item">
              <Calendar size={18} />
              <span>Events</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* ACCOUNT */}
          <div className="slide-menu-section">
            <h4>Account</h4>

            <Link to="/settings" className="slide-menu-item">
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
                  <Link to="/dashboard" className="slide-menu-item">
                    <BarChart3 size={18} />
                    <span>Dashboard</span>
                    <ChevronRight size={16} />
                  </Link>
                  <Link to="/create-event" className="slide-menu-item">
                    <Calendar size={18} />
                    <span>Create Event</span>
                    <ChevronRight size={16} />
                  </Link>

                  <Link to="/analytics" className="slide-menu-item">
                    <BarChart3 size={18} />
                    <span>Analytics</span>
                    <ChevronRight size={16} />
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link to="/admin/dashboard" className="slide-menu-item">
                  <BarChart3 size={18} />
                  <span>Admin Dashboard</span>
                  <ChevronRight size={16} />
                </Link>
              )}
            </div>
          )}

          {/* SUPPORT */}
          <div className="slide-menu-section">
            <h4>Support</h4>

            <Link to="/help" className="slide-menu-item">
              <HelpCircle size={18} />
              <span>Help</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* LOGOUT */}
          <div className="slide-menu-section">
            <button onClick={handleLogout} className="slide-menu-item logout">
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
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}