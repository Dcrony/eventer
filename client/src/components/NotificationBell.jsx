import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, X } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";

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
  const [desktopPos, setDesktopPos] = useState({ top: 0, left: 0, maxHeight: 520 });
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
      const pad = 12;
      const vh = window.innerHeight;

      let left = r.right + gap;
      const maxLeft = window.innerWidth - panelWidth - 16;
      if (left > maxLeft) {
        left = Math.max(16, r.left - panelWidth - gap);
      }

      const maxPanelHeight = Math.min(520, vh - pad * 2);
      let top = Math.max(pad, r.top);
      if (top + maxPanelHeight > vh - pad) {
        top = Math.max(pad, vh - pad - maxPanelHeight);
      }

      setDesktopPos({ top, left, maxHeight: maxPanelHeight });
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
      className={`bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in ${
        isMobile ? "fixed inset-x-4 bottom-20 top-auto" : ""
      }`}
      style={
        isMobile
          ? { zIndex: NOTIFICATION_PANEL_Z }
          : {
              position: "fixed",
              top: desktopPos.top,
              left: desktopPos.left,
              maxHeight: desktopPos.maxHeight,
              width: 360,
              zIndex: NOTIFICATION_PANEL_Z,
            }
      }
      role="dialog"
      aria-label="Notifications"
    >
      <header className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-extrabold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[0.65rem] font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-xs font-semibold text-pink-500 hover:text-pink-600 transition-colors"
          >
            Mark all read
          </button>
        )}
      </header>

      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="w-8 h-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Bell size={40} className="text-gray-300" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-gray-700 mt-2">No notifications yet</p>
            <p className="text-xs text-gray-400">We'll notify you when activity happens.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification._id}
              type="button"
              onClick={() => handleNotificationClick(notification)}
              className={`w-full text-left p-4 border-b border-gray-100 transition-colors duration-200 hover:bg-gray-50 ${
                !(notification.isRead ?? notification.read) ? "bg-pink-50/30" : ""
              }`}
            >
              <div className="flex gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${!(notification.isRead ?? notification.read) ? "bg-pink-500" : "bg-transparent"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-relaxed">{notification.message}</p>
                  <span className="text-xs text-gray-400 mt-1 block">
                    {formatNotificationTime(notification.createdAt)}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-pink-500 transition-all duration-200"
          aria-label="Notifications"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <Bell size={20} strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-pink-500 text-white text-[0.6rem] font-bold shadow-md shadow-pink-500/30">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>
      {dropdown && createPortal(dropdown, document.body)}
    </>
  );
};

export default NotificationBell;