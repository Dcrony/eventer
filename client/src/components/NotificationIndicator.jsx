import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";

export default function NotificationIndicator({ compact = false }) {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/notifications");
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-pink-500 transition-all duration-200"
        aria-label="Notifications"
      >
        <Bell size={20} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-pink-500 text-white text-[0.6rem] font-bold shadow-md shadow-pink-500/30">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}