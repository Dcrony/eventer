import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, CheckCheck, Trash2, Sparkles } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";

export default function NotificationsPage() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification) => {
    if (!(notification.isRead ?? notification.read)) {
      await markAsRead(notification._id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-geist pb-8 ">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 transition-all duration-200 hover:bg-pink-50 hover:text-pink-500"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-lg font-extrabold text-gray-900">Notifications</h1>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 transition-all duration-200 hover:bg-pink-50 hover:text-pink-500"
                title="Mark all as read"
              >
                <CheckCheck size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {notifications.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold">
              <Bell size={12} />
              {unreadCount} unread
            </span>
            <span className="text-xs text-gray-400">Total: {notifications.length}</span>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-8 h-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Bell size={56} className="text-gray-300" strokeWidth={1.5} />
            <h3 className="text-base font-bold text-gray-900 mt-2">No notifications yet</h3>
            <p className="text-sm text-gray-400">When you get notifications, they'll appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`group flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  !(notification.isRead ?? notification.read)
                    ? "bg-pink-50/50 border border-pink-200"
                    : "bg-white border border-gray-200 hover:border-pink-200 hover:shadow-md"
                }`}
              >
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${!(notification.isRead ?? notification.read) ? "bg-pink-500" : "bg-transparent"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-pink-600">
                      {notification.type || "system"}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(notification.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{notification.message}</p>
                </div>
                <button
                  className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteNotification(notification._id);
                  }}
                  aria-label="Delete notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}