import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  Settings,
  Ticket,
  Calendar,
  Heart,
  LogOut,
  ChevronRight,
  BarChart3,
  HelpCircle,
  Banknote,
  Users,
  DollarSign,
  Radio,
  Shield,
} from "lucide-react";

import { logout } from "../utils/auth";
import { useAuth } from "../context/AuthContext";
import { getProfileImageUrl } from "../utils/eventHelpers";
import NotificationIndicator from "./NotificationIndicator";
import Avatar from "./ui/avatar";

export default function TopNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isOrganizer = user?.role === "organizer" || user?.isOrganizer;
  const isFreeUser = user?.plan?.toLowerCase() === "free" || !user?.plan;
  const isAdmin = user?.role === "admin" || user?.isAdmin === true;

  const closeMenu = () => {
  setIsMenuOpen(false);
  document.body.style.overflow = "";
};

const openMenu = () => {
  setIsMenuOpen(true);
  document.body.style.overflow = "hidden";
};

  const handleLogout = () => {
  if (window.confirm("Logout from your account?")) {
    logout();
    navigate("/login");
    setIsMenuOpen(false);
    document.body.style.overflow = ""; // ← add this
  }
};

  const goToProfile = () => {
    if (!user) return;
    navigate(`/users/${user._id || user.id}`);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              TickiSpot
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Notification Bell with Dropdown */}
            <NotificationIndicator compact={false} />

            {/* Profile Button */}
            <button
              className="flex items-center gap-2 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
              onClick={openMenu}
              aria-label="Open Menu"
            >
              <Avatar
                src={user ? getProfileImageUrl(user) : null}
                name={user?.name || "User"}
                className="w-8 h-8 rounded-full"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Slide Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={closeMenu} />
      )}

      {/* Slide Menu */}
      <aside
        className={`fixed top-0 right-0 z-[100]  h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Account</span>
            <button onClick={closeMenu} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-pink-500 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* User Profile Card */}
          {user && (
            <div
              onClick={goToProfile}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer transition-all duration-200 hover:bg-pink-50 hover:border-pink-200 border border-transparent"
            >
              <Avatar src={getProfileImageUrl(user)} name={user.name} className="w-12 h-12 rounded-xl" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 truncate">{user.name}</h4>
                <p className="text-xs text-gray-500 truncate">@{user.username}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-3">
          {/* My Activity Section */}
          <div className="px-4 py-2">
            <label className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 block mb-2">My Activity</label>
            <div className="space-y-1">
              {isAdmin && (
                <MenuLink to="/admin/dashboard" icon={<Shield size={18} />} label="Admin" onClick={closeMenu} />
              )}
              <MenuLink to="/my-tickets" icon={<Ticket size={18} />} label="My Tickets" onClick={closeMenu} />
              <MenuLink to="/favorites" icon={<Heart size={18} />} label="Favorites" onClick={closeMenu} />
              <MenuLink to="/events" icon={<Calendar size={18} />} label="Events" onClick={closeMenu} />
              <MenuLink to="/live/events" icon={<Radio size={18} />} label="Live" onClick={closeMenu} />

              {isFreeUser && (
                <MenuLink to="/pricing" icon={<DollarSign size={18} />} label="Premium" onClick={closeMenu} />
              )}
            </div>
          </div>

          {/* Creator Tools Section */}
          {(isOrganizer || isAdmin) && (
            <div className="px-4 py-3 border-t border-gray-100 mt-2">
              <label className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 block mb-2">Creator Tools</label>
              <div className="space-y-1">
                {isOrganizer && (
                  <>
                    <MenuLink to="/dashboard" icon={<BarChart3 size={18} />} label="Dashboard" onClick={closeMenu} />
                    <MenuLink to="/earnings" icon={<Banknote size={18} />} label="Earnings" onClick={closeMenu} />
                    <MenuLink to="/team/invitations" icon={<Users size={18} />} label="Team Invitations" onClick={closeMenu} />
                  </>
                )}
                {isAdmin && (
                  <>
                    <MenuLink to="/admin/users" icon={<Users size={18} />} label="Admin Panel" onClick={closeMenu} />
                    <MenuLink to="/earnings" icon={<Banknote size={18} />} label="Earnings" onClick={closeMenu} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Preferences Section */}
          <div className="px-4 py-3 border-t border-gray-100 mt-2">
            <label className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 block mb-2">Preferences</label>
            <div className="space-y-1">
              <MenuLink to="/settings" icon={<Settings size={18} />} label="Settings" onClick={closeMenu} />
              <MenuLink to="/help" icon={<HelpCircle size={18} />} label="Help Center" onClick={closeMenu} />
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200">
                <LogOut size={18} />
                <span className="text-sm font-semibold">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

function MenuLink({ to, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 transition-all duration-200 hover:bg-pink-50 hover:text-pink-500 group"
    >
      <span className="flex-shrink-0 text-gray-400 group-hover:text-pink-500 transition-colors">{icon}</span>
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <ChevronRight size={14} className="text-gray-300 group-hover:text-pink-400 transition-colors" />
    </Link>
  );
}