import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import './NavBar.css'

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
    <div className="nav" >
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

            {user.isOrganizer && (
              <Link to="/create" 
              className="link">
                ➕ Create Event
              </Link>
            )}

            
            <div className="active-user">
              <img src="" alt="" />
              <div className="active"></div>
            </div>
            
            <button
              onClick={handleLogout}
              className="logout"
            >
              🚪 Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" 
            className="login-btn">
              🔐 Login
            </Link>
            <Link to="/register" 
            className="register-btn">
              📝 Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
