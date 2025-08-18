import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { logout, getCurrentUser } from "../utils/auth";
import "./css/NavBar.css";

export default function NavBar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      const updatedUser = getCurrentUser();
      setUser(updatedUser);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom logout event
    window.addEventListener('userLogout', handleStorageChange);
    window.addEventListener('userLogin', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogout', handleStorageChange);
      window.removeEventListener('userLogin', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      logout();
    }
  };


  return (
    <div className="nav">
      <div>
        <Link to="/" className="logo">
          🟡 TickiSpot
        </Link>
      </div>

      <div className="nav-welcome">
        {user ? (
          <>
            <span style={{ marginRight: "15px" }}>
              Welcome, <strong>{user.username}</strong>
            </span>

            <div className="search">
              <input type="text" placeholder="search" className="nav-search" />
              <span htmlFor="" className="nav-search-handlde">
                search
              </span>
            </div>

            <Link to="/events" className="events-link">
              🎫 Events
            </Link>

            <div className="notification">
              <Link to="/" className="link">
                🔔<div className="notice">0</div>
              </Link>
            </div>

            <div className="active-user">
              <img
                src={`http://localhost:5000/uploads/profile_pic/${user.profilePic}`}
                alt="Profile"
              />

              <div className="active"></div>

              <div className="dropdown">
                <Link to="/dashboard" className="link">
                   <span>Profile</span>
                </Link>
                <Link to="/dashboard" className="link">
                   <span>Dashboard</span>
                </Link>
                <Link to="/admin/dashboard" className="link">
                   <span>Stats</span>
                </Link>
                <button onClick={handleLogout} className="logout">
                  🚪 Logout
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="login-btn">
              🔐 Login
            </Link>
            <Link to="/register" className="register-btn">
              📝 Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
