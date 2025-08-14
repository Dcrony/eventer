import { Link, Navigate } from "react-router-dom";
import "./css/Sidebar.css";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    Navigate("/login");
  };

  return (
    <>
      {user && (
        <div className="Sidebar">
          <div className="Sidebar-contents">
            <Link to="/" className="link">
              🎛 <span>Home</span>
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
            <Link to="" className="link">
              <img src={user.profilePic} alt="" />
              <span>Profile</span>
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
