import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { isAuthenticated } from "../utils/auth";
import API from "../api/axios";
import "./css/MessageIndicator.css";

const MessageIndicator = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    // Only fetch if user is authenticated
    if (!isAuthenticated()) {
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const res = await API.get("/messages");
        // Sum up all unread counts from conversations
        const totalUnread = res.data.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
        setUnreadCount(totalUnread);
      } catch (err) {
        if (err.response?.status === 401) {
          console.warn("User not authenticated, skipping message fetch");
          return;
        }
        console.error("Failed to fetch message count:", err.message);
      }
    };

    fetchUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="message-indicator">
      <MessageSquare size={20} />
      {unreadCount > 0 && (
        <span className="message-indicator-badge">{unreadCount}</span>
      )}
    </div>
  );
};

export default MessageIndicator;