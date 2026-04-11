import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Menu, X, User, Settings, Radio, BarChart3, LogOut, ChevronRight,
  Ticket, Calendar, Heart, Star, Shield, CreditCard, HelpCircle,
  FileText, Users, Gift, TrendingUp, Award, Clock, DollarSign,
  MapPin, Share2, Download, Bell, Moon, Sun, Globe, Lock
} from "lucide-react";
import { getCurrentUser, logout } from "../utils/auth";
import "./css/TopNav.css";

export default function TopNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) setUser(currentUser);
    
    // Check for saved dark mode preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  const isAdmin = user?.role === "admin" || user?.isAdmin;
  const isOrganizer = user?.role === "organizer" || user?.isOrganizer;

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
      setIsMenuOpen(false);
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  const handleUserClick = () => {
    if (user?.id) {
      navigate(`/users/${user.id}`);
      setIsMenuOpen(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="top-nav">
        <div className="top-nav-container">
          <Link to="/" className="top-nav-logo">
            <span className="logo-text">TickiSpot</span>
          </Link>
          
          <div className="top-nav-actions">
            <button 
              className="top-nav-more-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="More menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-out More Menu */}
      <div className={`slide-menu ${isMenuOpen ? "open" : ""}`}>
        <div className="slide-menu-header">
          <div className="slide-menu-header-content">
            <h3>Menu</h3>
            <button onClick={closeMenu} className="slide-menu-close">
              <X size={24} />
            </button>
          </div>
          {user && (
            <div 
              className="slide-menu-user clickable"
              onClick={handleUserClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleUserClick();
                }
              }}
            >
              <div className="slide-menu-avatar">
                {user.profilePic ? (
                  <img src={user.profilePic} alt={user.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {user.name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="slide-menu-user-info">
                <h4>{user.name || user.username}</h4>
                <p>{user.email}</p>
                {user.isVerified && (
                  <span className="verified-badge">
                    <Shield size={12} /> Verified
                  </span>
                )}
              </div>
              <ChevronRight size={16} className="user-arrow" />
            </div>
          )}
        </div>

        <div className="slide-menu-content">
          {/* My Stuff Section */}
          <div className="slide-menu-section">
            <h4>My Stuff</h4>
            <Link to="/my-tickets" onClick={closeMenu} className="slide-menu-item">
              <Ticket size={20} />
              <span>My Tickets</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/transactions" onClick={closeMenu} className="slide-menu-item">
              <CreditCard size={20} />
              <span>Transactions</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/favorites" onClick={closeMenu} className="slide-menu-item">
              <Heart size={20} />
              <span>Favorites</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/watchlist" onClick={closeMenu} className="slide-menu-item">
              <Clock size={20} />
              <span>Watchlist</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
          </div>

          {/* Discover Section */}
          <div className="slide-menu-section">
            <h4>Discover</h4>
            <Link to="/events" onClick={closeMenu} className="slide-menu-item">
              <Calendar size={20} />
              <span>Browse Events</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/live/events" onClick={closeMenu} className="slide-menu-item">
              <Radio size={20} />
              <span>Live Events</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/trending" onClick={closeMenu} className="slide-menu-item">
              <TrendingUp size={20} />
              <span>Trending</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/recommended" onClick={closeMenu} className="slide-menu-item">
              <Star size={20} />
              <span>Recommended for You</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/nearby" onClick={closeMenu} className="slide-menu-item">
              <MapPin size={20} />
              <span>Nearby Events</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
          </div>

          {/* Account Section */}
          <div className="slide-menu-section">
            <h4>Account</h4>
            <Link to="/settings" onClick={closeMenu} className="slide-menu-item">
              <Settings size={20} />
              <span>Settings</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/payment-methods" onClick={closeMenu} className="slide-menu-item">
              <CreditCard size={20} />
              <span>Payment Methods</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/security" onClick={closeMenu} className="slide-menu-item">
              <Lock size={20} />
              <span>Security</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/referrals" onClick={closeMenu} className="slide-menu-item">
              <Users size={20} />
              <span>Refer & Earn</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
          </div>

          {/* Rewards Section */}
          <div className="slide-menu-section">
            <h4>Rewards</h4>
            <Link to="/loyalty" onClick={closeMenu} className="slide-menu-item">
              <Award size={20} />
              <span>Loyalty Points</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/offers" onClick={closeMenu} className="slide-menu-item">
              <Gift size={20} />
              <span>Offers & Discounts</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/wallet" onClick={closeMenu} className="slide-menu-item">
              <DollarSign size={20} />
              <span>Wallet</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
          </div>

          {/* Creator/Organizer Section */}
          {(isAdmin || isOrganizer) && (
            <div className="slide-menu-section">
              <h4>Creator Hub</h4>
              {isOrganizer && (
                <>
                  <Link to="/organizer/dashboard" onClick={closeMenu} className="slide-menu-item">
                    <BarChart3 size={20} />
                    <span>Dashboard</span>
                    <ChevronRight size={16} className="menu-arrow" />
                  </Link>
                  <Link to="/create-event" onClick={closeMenu} className="slide-menu-item">
                    <Calendar size={20} />
                    <span>Create Event</span>
                    <ChevronRight size={16} className="menu-arrow" />
                  </Link>
                  <Link to="/my-events" onClick={closeMenu} className="slide-menu-item">
                    <Ticket size={20} />
                    <span>My Events</span>
                    <ChevronRight size={16} className="menu-arrow" />
                  </Link>
                  <Link to="/analytics" onClick={closeMenu} className="slide-menu-item">
                    <TrendingUp size={20} />
                    <span>Analytics</span>
                    <ChevronRight size={16} className="menu-arrow" />
                  </Link>
                </>
              )}
              {isAdmin && (
                <>
                  <Link to="/admin/dashboard" onClick={closeMenu} className="slide-menu-item">
                    <BarChart3 size={20} />
                    <span>Admin Dashboard</span>
                    <ChevronRight size={16} className="menu-arrow" />
                  </Link>
                  <Link to="/admin/users" onClick={closeMenu} className="slide-menu-item">
                    <Users size={20} />
                    <span>User Management</span>
                    <ChevronRight size={16} className="menu-arrow" />
                  </Link>
                  <Link to="/admin/withdrawals" onClick={closeMenu} className="slide-menu-item">
                    <DollarSign size={20} />
                    <span>Withdrawals</span>
                    <ChevronRight size={16} className="menu-arrow" />
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Support Section */}
          <div className="slide-menu-section">
            <h4>Support</h4>
            <Link to="/help" onClick={closeMenu} className="slide-menu-item">
              <HelpCircle size={20} />
              <span>Help Center</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/contact" onClick={closeMenu} className="slide-menu-item">
              <Users size={20} />
              <span>Contact Support</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/faq" onClick={closeMenu} className="slide-menu-item">
              <FileText size={20} />
              <span>FAQ</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/report" onClick={closeMenu} className="slide-menu-item">
              <Shield size={20} />
              <span>Report Issue</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
          </div>

          {/* Legal Section */}
          <div className="slide-menu-section">
            <h4>Legal</h4>
            <Link to="/privacy" onClick={closeMenu} className="slide-menu-item">
              <Lock size={20} />
              <span>Privacy Policy</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/terms" onClick={closeMenu} className="slide-menu-item">
              <FileText size={20} />
              <span>Terms of Service</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/about" onClick={closeMenu} className="slide-menu-item">
              <Users size={20} />
              <span>About Us</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
          </div>

          {/* App Section */}
          <div className="slide-menu-section">
            <h4>App</h4>
            <button onClick={toggleDarkMode} className="slide-menu-item">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
              <ChevronRight size={16} className="menu-arrow" />
            </button>
            <Link to="/language" onClick={closeMenu} className="slide-menu-item">
              <Globe size={20} />
              <span>Language</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/share" onClick={closeMenu} className="slide-menu-item">
              <Share2 size={20} />
              <span>Share App</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
            <Link to="/download" onClick={closeMenu} className="slide-menu-item">
              <Download size={20} />
              <span>Download Data</span>
              <ChevronRight size={16} className="menu-arrow" />
            </Link>
          </div>

          {/* System Section */}
          <div className="slide-menu-section">
            <h4>System</h4>
            <button onClick={handleLogout} className="slide-menu-item logout">
              <LogOut size={20} />
              <span>Logout</span>
              <ChevronRight size={16} className="menu-arrow" />
            </button>
          </div>

          {/* App Version */}
          <div className="slide-menu-footer">
            <p className="app-version">Version 2.0.0</p>
            <p className="copyright">© 2024 TickiSpot. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isMenuOpen && <div className="slide-menu-overlay" onClick={closeMenu} />}
    </>
  );
}