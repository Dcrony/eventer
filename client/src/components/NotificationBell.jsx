import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import "./css/NotificationBell.css";

/** Below app modals (2000), above shell (sidebar ~999) */
const NOTIFICATION_PANEL_Z = 1990;

function formatNotificationTime(date) {
  const value = new Date(date);
  const now = new Date();
  const diffMs = now - value;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return value.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: value.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

const NotificationBell = () => {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false,
  );
  const [desktopPos, setDesktopPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    if (!open || isMobile) return;

    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 10;
      const panelWidth = 360;
      let left = r.right + gap;
      const top = Math.max(8, r.top);
      const maxLeft = window.innerWidth - panelWidth - 16;
      if (left > maxLeft) {
        left = Math.max(16, r.left - panelWidth - gap);
      }
      setDesktopPos({ top, left });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, isMobile]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current?.contains(event.target)) return;
      if (triggerRef.current?.contains(event.target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!(notification.isRead ?? notification.read)) {
      await markAsRead(notification._id);
    }

    setOpen(false);

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else {
      navigate("/notifications");
    }
  };

  const dropdown = open ? (
    <div
      ref={panelRef}
      className={`notification-bell-dropdown ${isMobile ? "is-mobile" : "is-portal-desktop"}`}
      style={
        isMobile
          ? { zIndex: NOTIFICATION_PANEL_Z }
          : {
              position: "fixed",
              top: desktopPos.top,
              left: desktopPos.left,
              zIndex: NOTIFICATION_PANEL_Z,
            }
      }
      role="dialog"
      aria-label="Notifications"
    >
      <header className="notification-bell-header">
        <div className="notification-bell-title-wrap">
          <h2 className="notification-bell-title">Notifications</h2>
          {unreadCount > 0 ? <span className="notification-bell-count">{unreadCount}</span> : null}
        </div>
        {unreadCount > 0 ? (
          <button type="button" className="notification-bell-mark-all" onClick={markAllAsRead}>
            Mark all read
          </button>
        ) : null}
      </header>

      <div className="notification-bell-list">
        {loading ? (
          <div className="notification-bell-loading">
            <div className="notification-bell-loading-spinner" />
            <span className="notification-bell-loading-text">Loading...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-bell-empty">
            <div className="notification-bell-empty-icon">
              <Bell size={28} strokeWidth={1.5} />
            </div>
            <p className="notification-bell-empty-title">No notifications yet</p>
            <p className="notification-bell-empty-subtitle">
              We&apos;ll notify you when activity happens.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification._id}
              type="button"
              className={`notification-bell-item ${
                notification.isRead ?? notification.read ? "is-read" : "is-unread"
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <span className="notification-bell-item-dot" aria-hidden="true" />
              <div className="notification-bell-item-body">
                <p className="notification-bell-item-message">{notification.message}</p>
                <span className="notification-bell-item-time">
                  {formatNotificationTime(notification.createdAt)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="notification-bell-wrap">
        <button
          ref={triggerRef}
          type="button"
          className="notification-bell-trigger"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Notifications"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <Bell size={22} strokeWidth={2} />
          {unreadCount > 0 ? (
            <span className="notification-bell-badge" aria-hidden="true">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
      </div>
      {dropdown && createPortal(dropdown, document.body)}
    </>
  );
};

export default NotificationBell;
