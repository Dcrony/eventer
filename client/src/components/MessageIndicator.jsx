import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { isAuthenticated } from "../utils/auth";
import API from "../api/axios";
import { useSocket } from "../hooks/useSocket";
import "./css/MessageIndicator.css";

const MessageIndicator = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket, currentUserId } = useSocket();

  useEffect(() => {
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
          // User not authenticated - silently skip
          return;
        }
        // Failed to fetch message count - will show 0
      }
    };

    fetchUnreadCount();

    return undefined;
  }, [currentUserId]);

  useEffect(() => {
    if (!socket || !currentUserId) return;

    const refreshUnreadCount = async () => {
      try {
        const res = await API.get("/messages");
        const totalUnread = res.data.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
        setUnreadCount(totalUnread);
      } catch (err) {
        // Failed to refresh message count - will keep current count
      }
    };

    socket.on("conversation_update", refreshUnreadCount);
    return () => socket.off("conversation_update", refreshUnreadCount);
  }, [currentUserId, socket]);

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
