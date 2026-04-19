import { createContext, useContext, useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import { useSocket } from "./useSocket";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { socket, currentUserId } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await API.get("/notifications/my");
        if (!cancelled) {
          setNotifications(res.data);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchNotifications();

    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleNewNotification = (notification) => {
      setNotifications((current) => {
        if (current.some((item) => item._id === notification._id)) {
          return current;
        }

        return [notification, ...current];
      });
    };

    socket.on("new_notification", handleNewNotification);
    return () => socket.off("new_notification", handleNewNotification);
  }, [currentUserId, socket]);

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true, read: true } : item)),
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/mark-all");
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, read: true })));
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const value = useMemo(
    () => ({
      notifications,
      setNotifications,
      loading,
      unreadCount: notifications.filter((item) => !(item.isRead ?? item.read)).length,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    }),
    [loading, notifications],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }

  return context;
}
