import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { isAuthenticated } from "../utils/auth";
import API from "../api/axios";
import { useSocket } from "../hooks/useSocket";

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
        const totalUnread = res.data.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
        setUnreadCount(totalUnread);
      } catch (err) {
        if (err.response?.status === 401) {
          return;
        }
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
    <div className="relative">
      <MessageSquare size={20} className="text-gray-600 transition-colors duration-200 hover:text-pink-500" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-pink-500 text-white text-[0.65rem] font-bold shadow-md shadow-pink-500/30">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </div>
  );
};

export default MessageIndicator;