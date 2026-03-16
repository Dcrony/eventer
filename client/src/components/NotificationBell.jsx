import { useContext, useState, useEffect, useRef } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { useSocket } from "../hooks/useSocket";
import { Bell } from "lucide-react";
import { ThemeContext } from "../contexts/ThemeContexts";
import "./css/NotificationBell.css";

function formatNotificationTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

const NotificationBell = ({ userId }) => {
  const { notifications, setNotifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const { darkMode } = useContext(ThemeContext);
  const dropdownRef = useRef(null);

  useSocket(userId, (data) => {
    setNotifications((prev) => [
      { ...data, _id: data._id || Date.now(), read: false, createdAt: data.createdAt || new Date().toISOString() },
      ...prev,
    ]);
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`notification-bell-wrap ${darkMode ? "dark-mode" : ""}`} ref={dropdownRef}>
      <button
        type="button"
        className="notification-bell-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={22} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="notification-bell-badge" aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-bell-dropdown" role="dialog" aria-label="Notifications">
          <header className="notification-bell-header">
            <div className="notification-bell-title-wrap">
              <h2 className="notification-bell-title">Notifications</h2>
              {unreadCount > 0 && (
                <span className="notification-bell-count">{unreadCount}</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-bell-mark-all"
                onClick={() => markAllAsRead()}
              >
                Mark all read
              </button>
            )}
          </header>

          <div className="notification-bell-list">
            {loading ? (
              <div className="notification-bell-loading">
                <div className="notification-bell-loading-spinner" />
                <span className="notification-bell-loading-text">Loading…</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-bell-empty">
                <div className="notification-bell-empty-icon">
                  <Bell size={28} strokeWidth={1.5} />
                </div>
                <p className="notification-bell-empty-title">No notifications yet</p>
                <p className="notification-bell-empty-subtitle">
                  We’ll notify you when something arrives.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  type="button"
                  className={`notification-bell-item ${n.read ? "is-read" : "is-unread"}`}
                  onClick={() => markAsRead(n._id)}
                >
                  <span className="notification-bell-item-dot" aria-hidden="true" />
                  <div className="notification-bell-item-body">
                    <p className="notification-bell-item-message">{n.message}</p>
                    <span className="notification-bell-item-time">
                      {formatNotificationTime(n.createdAt)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
