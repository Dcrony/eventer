import { useEffect, useState } from "react";
import API from "../api/axios";

// ✅ Fix: Use BACKEND URL, not frontend URL
const API_URL =
  import.meta.env.VITE_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://tickispotbackend.onrender.com/api"  // Your BACKEND URL
    : "http://localhost:8080/api");

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Create axios instance with correct baseURL
  const axiosInstance = API.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // ✅ Fetch notifications on load
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        console.log("Fetching from:", API_URL); // Debug log
        const res = await axiosInstance.get("/notifications/my");
        setNotifications(res.data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        console.error("API URL used:", API_URL); // Debug log
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // ✅ Mark single notification as read
  const markAsRead = async (id) => {
    try {
      await axiosInstance.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // ✅ Mark all as read
  const markAllAsRead = async () => {
    try {
      await axiosInstance.put("/notifications/mark-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // ✅ Delete a notification
  const deleteNotification = async (id) => {
    try {
      await axiosInstance.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  return {
    notifications,
    setNotifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
