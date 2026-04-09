import { useEffect, useState } from "react";
import API from "../../api/axios";
import useProfileNavigation from "../../hooks/useProfileNavigation";
import { PORT_URL } from "../../utils/config";

export default function ChatList({ setSelectedUser, selectedUser }) {
  const { toProfile } = useProfileNavigation();
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await API.get("/messages");
        setChats(res.data);
      } catch (err) {
        console.error("Failed to fetch chats:", err);
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
        avatar: selectedUser.profilePic ? `${PORT_URL}/uploads/profile_pic/${selectedUser.profilePic}` : null
      },
      lastMessage: null
    });
  }

  const filteredChats = allConversations.filter(chat =>
    chat.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <p>No conversations found</p>
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
                    src={chat.user.avatar.startsWith('http') ? chat.user.avatar : `${PORT_URL}/uploads/profile_pic/${chat.user.avatar}`} 
                    alt={chat.user.name} 
                  />
                ) : (
                  <div className="avatar-fallback">
                    {chat.user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="chat-item-content">
                <h4>{chat.user.name}</h4>
                <p>{chat.lastMessage?.text || "Start a conversation"}</p>
                {chat.unreadCount > 0 && (
                  <span className="chat-item-unread">{chat.unreadCount}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}