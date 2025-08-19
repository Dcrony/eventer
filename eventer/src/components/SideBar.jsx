import { Link } from "react-router-dom";
import "./css/Sidebar.css";
import { useEffect, useState } from "react";
import { logout, getCurrentUser } from "../utils/auth";

export default function Sidebar() {
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

    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom logout event
    window.addEventListener("userLogout", handleStorageChange);
    window.addEventListener("userLogin", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userLogout", handleStorageChange);
      window.removeEventListener("userLogin", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      logout();
    }
  };

  return (
    <>
      {user && (
        <div className="Sidebar">
          <div className="Sidebar-contents">
            <Link to="/dashboard" className="link">
              🎛 <span>Dashboard</span>
            </Link>

            <Link to="/events" className="link">
              🎫 <span>Events</span>
            </Link>

            <Link to="/admin/dashboard" className="link">
              📊 <span>Stats</span>
            </Link>

            <Link to="/tickets" className="link">
              🎫 <span>My Tickets</span>
            </Link>

            <Link to="/live/events" className="link">
              ⭕ <span>Live </span>
            </Link>

            {user && (
              <Link to="/create" className="link">
                ➕ Create Event
              </Link>
            )}

            <Link to="/settings" className="link">
              ⚙ <span>Settings</span>
            </Link>
          </div>

          <div className="logout-sec">
            <Link to={`/profile`} className="link">
              <div className="active-user">
                <img
                  src={`http://localhost:5000/uploads/profile_pic/${user.profilePic}`}
                  alt="Profile"
                />

                <span>Profile</span>
              </div>
            </Link>
            <button onClick={handleLogout} className="logout">
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
