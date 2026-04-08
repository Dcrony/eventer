import { useEffect, useRef, useState } from "react";
import { Send, Phone, Info } from "lucide-react";
import MessageBubble from "./MessageBubble";
import socket from "../../socket";
import API from "../../api/axios";
import useProfileNavigation from "../../hooks/useProfileNavigation";
import { PORT_URL } from "../../utils/config";

export default function ChatWindow({ currentUser, selectedUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const { toProfile } = useProfileNavigation();
  const messagesEndRef = useRef(null);

  // Fetch messages when selectedUser changes
  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    const fetchMessages = async () => {
      try {
        const res = await API.get(`/messages/${selectedUser._id}`);
        setMessages(res.data);

        // Mark messages as read
        await API.put(`/messages/read/${selectedUser._id}`);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [currentUser, selectedUser]);

  // Socket listeners
  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("typing", () => setTyping(true));
    socket.on("stopTyping", () => setTyping(false));

    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = async () => {
    if (!text.trim() || !currentUser || !selectedUser) return;

    const msg = {
      senderId: currentUser._id,
      receiverId: selectedUser._id,
      text,
    };

    // Emit socket message
    socket.emit("sendMessage", msg);

    try {
      await API.post("/messages", {
        receiverId: selectedUser._id,
        text,
      });
      setMessages((prev) => [...prev, msg]);
      setText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleTyping = () => {
    if (!currentUser || !selectedUser) return;

    socket.emit("typing", {
      senderId: currentUser._id,
      receiverId: selectedUser._id,
    });

    setTimeout(() => {
      socket.emit("stopTyping", {
        senderId: currentUser._id,
        receiverId: selectedUser._id,
      });
    }, 1000);
  };

  // If user data isn’t ready, show a placeholder
  if (!selectedUser) {
    return <div className="chat-window">Select a user to start chatting...</div>;
  }

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-window-header">
        <div
          className="chat-header-user"
          role="button"
          tabIndex={0}
          onClick={() => toProfile(selectedUser)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toProfile(selectedUser);
            }
          }}
        >
          <div className="chat-header-avatar">
            {selectedUser.profilePic ? (
              <img
                src={`${PORT_URL}/uploads/profile_pic/${selectedUser.profilePic}`}
                alt={selectedUser.username}
                className="avatar-img"
              />
            ) : (
              <div className="avatar-fallback">
                {selectedUser.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <span className="online-indicator"></span>
          </div>
          <div className="chat-header-info">
            <h3 className="chat-header-name">{selectedUser.username || "User"}</h3>
            <p className="chat-header-status">Online</p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="chat-header-btn" title="Call">
            <Phone size={20} />
          </button>
          <button className="chat-header-btn" title="Info">
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-window-messages">
        <div className="messages">
          {messages.length === 0 ? (
            <div className="chat-no-messages">
              <div className="chat-no-messages-icon">💬</div>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i}>
                <MessageBubble
                  message={msg}
                  isMe={msg.senderId === currentUser._id}
                  currentUser={currentUser}
                />
              </div>
            ))
          )}
          {typing && (
            <div className="typing-indicator">
              <div className="typing-bubble">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input Area */}
      <div className="chat-input-area">
        <div className="chat-input">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message... (Shift+Enter for new line)"
            disabled={!currentUser || !selectedUser}
            className="chat-input-field"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || !currentUser || !selectedUser}
            className="chat-send-btn"
            title="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}