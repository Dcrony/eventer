import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { logout, getCurrentUser } from "../utils/auth";
import NotificationBell from "./NotificationBell";
import { PORT_URL } from "../utils/config";
import "./css/Navbar.css";

export default function NavBar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) setUser(currentUser);

    const handleStorageChange = () => setUser(getCurrentUser());

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userLogout", handleStorageChange);
    window.addEventListener("userLogin", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userLogout", handleStorageChange);
      window.removeEventListener("userLogin", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) logout();
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        
        <div className="navbar-right">
          <span className="welcome-text">
            Welcome, <strong>{user.username}</strong>
          </span>

          <div className="notification-bell">
            <NotificationBell />
          </div>

          <div className="profile-dropdown group">
            <img
              src={`${PORT_URL}/uploads/profile_pic/${user.profilePic}`}
              alt="Profile"
              className="nav-profile-pic"
            />
            <div className="dropdown-menu">
              <Link to="/profile/me">👤 Profile</Link>
              <Link to="/dashboard">📋 Dashboard</Link>
              <Link to="/admin/dashboard">📊 Stats</Link>
              <button onClick={handleLogout} className="logout-btn">
                🚪 Logout
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </nav>
  );
}
