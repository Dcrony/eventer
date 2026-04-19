import { useEffect, useState } from "react";
import API from "../../api/axios";
import useProfileNavigation from "../../hooks/useProfileNavigation";
import { getProfileImageUrl } from "../../utils/eventHelpers";
import { isUserOnline } from "../../utils/messaging";

export default function ChatList({ setSelectedUser, selectedUser, onlineUserIds = [] }) {
  const { toProfile } = useProfileNavigation();
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const res = await API.get("/messages");
        // Ensure each chat has the expected structure
        const formattedChats = res.data.map(chat => ({
          ...chat,
          user: {
            _id: chat.user.id || chat.user._id,
            name: chat.user.name,
            username: chat.user.username,
            profilePic: chat.user.profilePic,
            avatar: getProfileImageUrl(chat.user),
          }
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

  // Combine existing chats with selected user if not already in chats
  const allConversations = [...chats];
  if (selectedUser && !chats.find(chat => chat.user._id === selectedUser._id)) {
    allConversations.unshift({
      user: {
        _id: selectedUser._id,
        name: selectedUser.name || selectedUser.username,
        username: selectedUser.username,
        profilePic: selectedUser.profilePic,
        avatar: getProfileImageUrl(selectedUser),
      },
      lastMessage: null,
      unreadCount: 0
    });
  }

  const filteredChats = allConversations.filter(chat =>
    chat.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="chat-list">
        <div className="chat-list-header">
          <h2>Messages</h2>
        </div>
        <div className="chat-list-loading">
          <div className="loading-spinner"></div>
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Messages</h2>
      </div>
      <div className="chat-list-search">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="chat-list-items">
        {filteredChats.length === 0 ? (
          <div className="chat-list-empty">
            <svg className="chat-list-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No conversations found</p>
            <span>Start a new conversation by visiting someone's profile</span>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.user._id}
              className={`chat-item ${selectedUser?._id === chat.user._id ? "active" : ""}`}
              onClick={() => setSelectedUser(chat.user)}
            >
              <div className="chat-item-avatar">
                {chat.user.avatar ? (
                  <img 
                    src={chat.user.avatar} 
                    alt={chat.user.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<div class="avatar-fallback">${chat.user.name?.charAt(0)?.toUpperCase() || "U"}</div>`;
                    }}
                  />
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
                  <h4>{chat.user.name}</h4>
                  <p className="chat-item-last-message">
                    {chat.lastMessage?.text || "Start a conversation"}
                  </p>
                </div>
                <div className="chat-item-meta">
                  {chat.lastMessage?.createdAt && (
                    <span className="chat-item-time">
                      {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {chat.unreadCount > 0 && (
                    <span className="chat-item-unread">{chat.unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}