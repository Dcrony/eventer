import { useEffect, useState } from "react";
import API from "../../api/axios";
import useProfileNavigation from "../../hooks/useProfileNavigation";

export default function ChatList({ setSelectedUser, selectedUserId }) {
  const { toProfile } = useProfileNavigation();
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchChats = async () => {
      const res = await API.get("/messages");
      setChats(res.data);
    };

    fetchChats();
  }, []);

  const filteredChats = chats.filter(chat =>
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
      {filteredChats.map((chat) => (
        <div
          key={chat.user._id}
          className={`chat-item ${selectedUserId === chat.user._id ? 'active' : ''}`}
          onClick={() => setSelectedUser(chat.user)}
        >
          <div
            className="chat-user-link"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              toProfile(chat.user);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                toProfile(chat.user);
              }
            }}
          >
            <img src={chat.user.avatar} alt="" />
            <div>
              <h4>{chat.user.name}</h4>
              <p>{chat.lastMessage.text}</p>
            </div>
          </div>
        </div>
      ))}
      {filteredChats.length === 0 && (
        <div className="chat-list-empty">
          <p>No conversations found</p>
        </div>
      )}
    </div>
  );
}