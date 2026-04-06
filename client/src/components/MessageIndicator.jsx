import { useState, useEffect, useContext } from "react";
import { MessageSquare } from "lucide-react";
import { ThemeContext } from "../contexts/ThemeContexts";
import API from "../api/axios";
import "./css/MessageIndicator.css";

const MessageIndicator = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await API.get("/messages");
        // Sum up all unread counts from conversations
        const totalUnread = res.data.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
        setUnreadCount(totalUnread);
      } catch (err) {
        console.error("Failed to fetch message count:", err);
      }
    };

    fetchUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`message-indicator ${darkMode ? "dark-mode" : ""}`}>
      <MessageSquare size={20} />
      {unreadCount > 0 && (
        <span className="message-indicator-badge">{unreadCount}</span>
      )}
    </div>
  );
};

export default MessageIndicator;