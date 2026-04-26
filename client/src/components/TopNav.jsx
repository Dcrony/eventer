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
      <header className="top-nav">
        <div className="top-nav-container">
          

          <Link to="/" className="top-nav-logo">
            <span className="logo-text">TickiSpot</span>
          </Link>

          <div className="top-nav-actions">
            <Link to="/notifications" className="nav-icon-btn" aria-label="Notifications">
              <Bell size={22} />
            </Link>

            <button 
            className="top-nav-profile-trigger" 
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open Menu"
          >
            <Avatar 
              src={user ? getProfileImageUrl(user) : null} 
              name={user?.name || "User"} 
              className="avatar-mini" 
            />
          </button>
          </div>
        </div>
      </header>

      {/* SLIDE MENU */}
      <aside className={`slide-menu ${isMenuOpen ? "open" : ""}`}>
        <div className="slide-menu-header">
          <div className="header-top">
            <span className="menu-title">Account</span>
            <button className="close-btn" onClick={closeMenu}><X size={22} /></button>
          </div>

          {user && (
            <div className="user-profile-card" onClick={goToProfile}>
              <Avatar src={getProfileImageUrl(user)} name={user.name} className="avatar-large" />
              <div className="user-details">
                <h4>{user.name}</h4>
                <p>@{user.username}</p>
              </div>
              <ChevronRight size={18} className="fade-icon" />
            </div>
          )}
        </div>

        <div className="slide-menu-scrollable">
          <nav className="slide-menu-section">
            <label>My Activity</label>
            <MenuLink to="/my-tickets" icon={<Ticket size={20} />} label="My Tickets" onClick={closeMenu} />
            <MenuLink to="/favorites" icon={<Heart size={20} />} label="Favorites" onClick={closeMenu} />
            <MenuLink to="/events" icon={<Calendar size={20} />} label="Events" onClick={closeMenu} />
          </nav>

          {(isOrganizer || isAdmin) && (
            <nav className="slide-menu-section">
              <label>Creator Tools</label>
              {isOrganizer && (
                <>
                  <MenuLink to="/dashboard" icon={<BarChart3 size={20} />} label="Dashboard" onClick={closeMenu} />
                  <MenuLink to="/earnings" icon={<Banknote size={20} />} label="Earnings" onClick={closeMenu} />
                </>
              )}
              {isAdmin && (
                <MenuLink to="/admin/users" icon={<Users size={20} />} label="Admin Panel" onClick={closeMenu} />
              )}
            </nav>
          )}

          <nav className="slide-menu-section">
            <label>Preferences</label>
            <MenuLink to="/settings" icon={<Settings size={20} />} label="Settings" onClick={closeMenu} />
            <MenuLink to="/help" icon={<HelpCircle size={20} />} label="Help Center" onClick={closeMenu} />
            <button className="menu-item-btn logout" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      </aside>

      {isMenuOpen && <div className="menu-overlay" onClick={closeMenu} />}
    </>
  );
}

function MenuLink({ to, icon, label, onClick }) {
  return (
    <Link to={to} className="menu-item-btn" onClick={onClick}>
      {icon}
      <span>{label}</span>
      <ChevronRight size={14} className="arrow" />
    </Link>
  );
}