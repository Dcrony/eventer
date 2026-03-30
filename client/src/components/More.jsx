import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../utils/auth";
import "./css/More.css"
import {
  User,
  Settings,
  Bell,
  Radio,
  BarChart3,
  LogOut,
} from "lucide-react";

export default function More() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) setUser(currentUser);
  }, []);

  if (!user) return null;

  const isAdmin = user?.role === "admin" || user?.isAdmin;

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  return (
    <div className="more-page">
      <h2>More</h2>

      {/* Account */}
      <section>
        <h4>Account</h4>
        <Link to={`/profile/${user?._id}`}><User size={18}/> Profile</Link>
        <Link to="/settings"><Settings size={18}/> Settings</Link>
      </section>

      {/* Activity */}
      <section>
        <h4>Activity</h4>
        <Link to="/live/events"><Radio size={18}/> Live Events</Link>
        {/* ✅ Link to NotificationsPage for mobile */}
        <Link to="/notifications"><Bell size={18}/> Notifications</Link>
      </section>

      {/* Admin */}
      {isAdmin && (
        <div>
          <section>
            <h4>Admin</h4>
            <Link to="/admin/dashboard"><BarChart3 size={18}/> Admin Dashboard</Link>
          </section>
          <section>
            <h4>Withdrawal Management</h4>
            <Link to="/admin/withdrawals"><BarChart3 size={18}/> View Withdrawals</Link>
          </section>
        </div>
      )}

      {/* System */}
      <section>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18}/> Logout
        </button>
      </section>
    </div>
  );
}