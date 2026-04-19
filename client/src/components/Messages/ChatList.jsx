import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { MessageCircleMore, Search } from "lucide-react";
import API from "../../api/axios";
import { useSocket } from "../../hooks/useSocket";
import { getProfileImageUrl } from "../../utils/eventHelpers";
import { isUserOnline } from "../../utils/messaging";

export default function ChatList({ setSelectedUser, selectedUser, onlineUserIds = [] }) {
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const deferredSearch = useDeferredValue(searchTerm);
  const { socket, currentUserId } = useSocket();

  const formatChatUser = (u) => ({
    _id: u.id || u._id,
    name: u.name,
    username: u.username,
    profilePic: u.profilePic,
    avatar: getProfileImageUrl(u),
  });

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const res = await API.get("/messages");
        const formattedChats = res.data.map((chat) => ({
          ...chat,
          user: formatChatUser(chat.user),
        }));
        setChats(formattedChats);
      } catch (err) {
        console.error("Failed to fetch chats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  useEffect(() => {
    if (!socket || !currentUserId) return;

    const refreshChats = async () => {
      try {
        const res = await API.get("/messages");
        const formattedChats = res.data.map((chat) => ({
          ...chat,
          user: formatChatUser(chat.user),
        }));
        setChats(formattedChats);
      } catch (err) {
        console.error("Failed to refresh chats:", err);
      }
    };

    socket.on("conversation_update", refreshChats);
    return () => socket.off("conversation_update", refreshChats);
  }, [currentUserId, socket]);

  const allConversations = [...chats];
  if (selectedUser && !chats.find((chat) => chat.user._id === selectedUser._id)) {
    allConversations.unshift({
      user: formatChatUser(selectedUser),
      lastMessage: null,
      unreadCount: 0,
    });
  }

  const filteredChats = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();
    if (!normalized) return allConversations;

    return allConversations.filter(
      (chat) =>
        chat.user.name?.toLowerCase().includes(normalized) ||
        chat.user.username?.toLowerCase().includes(normalized),
    );
  }, [allConversations, deferredSearch]);

  if (loading) {
    return (
      <div className="chat-list-shell">
        <div className="chat-list-topbar">
          <div>
            <h2>Messages</h2>
            <p>Loading your conversations…</p>
          </div>
        </div>
        <div className="chat-list-loading">
          <div className="loading-spinner"></div>
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-list-shell">
      <div className="chat-list-topbar">
        <div>
          <h2>Messages</h2>
          <p>
            {filteredChats.length} conversation{filteredChats.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <label className="chat-list-search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search conversations"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </label>

      <div className="chat-list-items">
        {filteredChats.length === 0 ? (
          <div className="chat-list-empty">
            <div className="chat-list-empty-icon">
              <MessageCircleMore size={26} />
            </div>
            <p>No conversations found</p>
            <span>Start a new conversation by visiting someone&apos;s profile</span>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <button
              key={chat.user._id}
              type="button"
              className={`chat-item ${selectedUser?._id === chat.user._id ? "active" : ""}`}
              onClick={() => setSelectedUser(chat.user)}
            >
              <div className="chat-item-avatar">
                {chat.user.avatar ? (
                  <img src={chat.user.avatar} alt={chat.user.name} />
                ) : (
                  <div className="avatar-fallback">
                    {chat.user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <span
                  className={`online-indicator chat-item-online-indicator ${isUserOnline(onlineUserIds, chat.user._id) ? "online" : "offline"}`}
                  aria-hidden
                />
              </div>

              <div className="chat-item-content">
                <div className="chat-item-info">
                  <div className="chat-item-title-row">
                    <h4>{chat.user.name}</h4>
                    {chat.user.username ? <span>@{chat.user.username}</span> : null}
                  </div>
                  <p className="chat-item-last-message">
                    {chat.lastMessage?.text || "Start a conversation"}
                  </p>
                </div>

                <div className="chat-item-meta">
                  {chat.lastMessage?.createdAt ? (
                    <span className="chat-item-time">
                      {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : null}
                  {chat.unreadCount > 0 ? <span className="chat-item-unread">{chat.unreadCount}</span> : null}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
