// components/NotificationsPage.jsx
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { Bell, ArrowLeft, CheckCheck, Trash2 } from "lucide-react";
import "./css/notificationsPage.css";

// Add pull-to-refresh for mobile
import { useCallback } from "react";
import { useState } from "react";


export default function NotificationsPage() {
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={24} />
        </button>
        <h1>Notifications</h1>
        {notifications.length > 0 && (
          <button onClick={markAllAsRead} className="mark-all-btn" title="Mark all as read">
            <CheckCheck size={20} />
          </button>
        )}
      </div>

      {/* Stats */}
      {notifications.length > 0 && (
        <div className="notifications-stats">
          <span className="unread-badge">
            <Bell size={14} />
            {unreadCount} unread
          </span>
          <span className="total-count">Total: {notifications.length}</span>
        </div>
      )}

      {/* Notifications List */}
      <div className="notifications-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} className="empty-icon" />
            <h3>No notifications yet</h3>
            <p>When you get notifications, they'll appear here</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => markAsRead(notification._id)}
            >
              <div className="notification-content">
                <div className="notification-header">
                  <span className="notification-type">{notification.type || 'system'}</span>
                  <span className="notification-time">{formatDate(notification.createdAt)}</span>
                </div>
                <p className="notification-message">{notification.message}</p>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification._id);
                }}
                aria-label="Delete notification"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}