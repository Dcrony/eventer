import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { logout, getCurrentUser } from "../utils/auth";

export default function Sidebar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    const handleStorageChange = () => {
      const updatedUser = getCurrentUser();
      setUser(updatedUser);
    };

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
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      logout();
    }
  };

  return (
    <>
      {user && (
        <aside className="fixed top-0 left-0 w-64 h-screen bg-gray-900 text-white flex flex-col justify-between shadow-2xl ">
          {/* Sidebar Links */}
          <div className="px-5 py-6 space-y-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition font-medium"
            >
              🎛 <span>Dashboard</span>
            </Link>

            <Link
              to="/events"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition font-medium"
            >
              🎫 <span>Events</span>
            </Link>

            <Link
              to="/admin/dashboard"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition font-medium"
            >
              📊 <span>Stats</span>
            </Link>

            <Link
              to="/my-tickets"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition font-medium"
            >
              🎟 <span>My Tickets</span>
            </Link>

            <Link
              to="/live/events"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition font-medium"
            >
              ⭕ <span>Live</span>
            </Link>

            {user && (
              <Link
                to="/create"
                className="flex items-center gap-3 p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition font-medium"
              >
                ➕ <span>Create Event</span>
              </Link>
            )}

            <Link
              to="/settings"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition font-medium"
            >
              ⚙ <span>Settings</span>
            </Link>
          </div>

          {/* Bottom Section */}
          <div className="px-5 py-4 border-t border-gray-700">
            <Link
              to="/me"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
            >
              <img
                src={`http://localhost:5000/uploads/profile_pic/${user.profilePic}`}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border border-gray-600"
              />
              <span className="font-medium">{user.name || "Profile"}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full mt-3 flex items-center gap-2 p-3 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition font-medium"
            >
              🚪 Logout
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
