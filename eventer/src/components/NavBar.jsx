import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./css/NavBar.css";

export default function NavBar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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
    navigate("/login");
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
