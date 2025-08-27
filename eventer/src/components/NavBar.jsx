import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { logout, getCurrentUser } from "../utils/auth";

export default function NavBar() {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) setUser(currentUser);

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
    if (window.confirm("Are you sure you want to logout?")) logout();
  };

  return (
    <nav className="bg-gray-900 text-white shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold tracking-wide text-yellow-400">
          🟡 TickiSpot
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              <span className="text-sm text-gray-300">
                Welcome, <strong className="text-white">{user.username}</strong>
              </span>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="px-3 py-1 rounded-lg bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <span className="absolute right-2 top-1 text-xs text-gray-400">🔍</span>
              </div>

              <Link to="/events" className="hover:text-yellow-400 transition">
                🎫 Events
              </Link>

              {/* Notification */}
              <div className="relative">
                <Link to="/" className="hover:text-yellow-400">
                  🔔
                </Link>
                <span className="absolute -top-1 -right-2 bg-red-500 text-xs px-1 rounded-full">
                  0
                </span>
              </div>

              {/* User Profile Dropdown */}
              <div className="relative group">
                <img
                  src={`${
                    import.meta.env.VITE_API_URL?.replace("/api", "") ||
                    "http://localhost:5000"
                  }/uploads/profile_pic${user.profilePic}`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-yellow-400 cursor-pointer"
                />

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 shadow-lg rounded-lg opacity-0 group-hover:opacity-100 transition duration-200">
                  <Link to="/dashboard" className="block px-4 py-2 text-sm hover:bg-gray-700">
                    👤 Profile
                  </Link>
                  <Link to="/dashboard" className="block px-4 py-2 text-sm hover:bg-gray-700">
                    📋 Dashboard
                  </Link>
                  <Link to="/admin/dashboard" className="block px-4 py-2 text-sm hover:bg-gray-700">
                    📊 Stats
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 bg-yellow-400 text-black rounded-lg font-medium hover:bg-yellow-300 transition"
              >
                🔐 Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 border border-yellow-400 rounded-lg hover:bg-yellow-400 hover:text-black transition"
              >
                📝 Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden focus:outline-none"
        >
          {isMenuOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-800 px-4 py-3 space-y-3">
          {user ? (
            <>
              <p className="text-sm text-gray-300">
                Welcome, <strong className="text-white">{user.username}</strong>
              </p>
              <Link to="/events" className="block hover:text-yellow-400">
                🎫 Events
              </Link>
              <Link to="/dashboard" className="block hover:text-yellow-400">
                👤 Profile
              </Link>
              <Link to="/dashboard" className="block hover:text-yellow-400">
                📋 Dashboard
              </Link>
              <Link to="/admin/dashboard" className="block hover:text-yellow-400">
                📊 Stats
              </Link>
              <button
                onClick={handleLogout}
                className="block text-red-400 hover:text-red-500"
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block hover:text-yellow-400">
                🔐 Login
              </Link>
              <Link to="/register" className="block hover:text-yellow-400">
                📝 Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
