import { useEffect, useRef, useState } from "react";
import { Send, Phone, Info, MoreVertical } from "lucide-react";
import MessageBubble from "./MessageBubble";
import socket from "../../socket";
import API from "../../api/axios";
import useProfileNavigation from "../../hooks/useProfileNavigation";
import { getProfileImageUrl } from "../../utils/eventHelpers";
import { isMessageFromMe } from "../../utils/messaging";

export default function ChatWindow({ currentUser, selectedUser, peerOnline = false }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toProfile } = useProfileNavigation();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const myUserId = currentUser?.id ?? currentUser?._id;

  // Fetch messages when selectedUser changes
  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/messages/${selectedUser._id}`);
        // Ensure messages have consistent structure
        const formattedMessages = res.data.map((msg) => ({
          ...msg,
          senderId: msg.sender?._id ?? msg.sender,
          receiverId: msg.receiver?._id ?? msg.receiver,
          text: msg.text,
          createdAt: msg.createdAt,
          seen: msg.seen,
        }));
        setMessages(formattedMessages);

        // Mark messages as read
        await API.put(`/messages/read/${selectedUser._id}`);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [currentUser, selectedUser]);

  // Socket listeners
  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    // Join room for private chat
    const room = [myUserId, selectedUser._id].sort().join("-");
    socket.emit("joinChat", room);

    socket.on("receiveMessage", (data) => {
      if (!data?.senderId || !myUserId) return;
      const from = String(data.senderId);
      const other = String(selectedUser._id);
      const me = String(myUserId);
      if (from !== other && from !== me) return;
      setMessages((prev) => [...prev, data]);
      if (from === other) {
        API.put(`/messages/read/${selectedUser._id}`).catch(console.error);
      }
    });

    socket.on("typing", (payload) => {
      const senderId = payload && typeof payload === "object" ? payload.senderId : payload;
      if (String(senderId) === String(selectedUser._id)) setIsTyping(true);
    });

    socket.on("stopTyping", (payload) => {
      const senderId = payload && typeof payload === "object" ? payload.senderId : payload;
      if (String(senderId) === String(selectedUser._id)) setIsTyping(false);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("stopTyping");
      socket.emit("leaveChat", room);
    };
  }, [currentUser, selectedUser, myUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!text.trim() || !currentUser || !selectedUser || !myUserId) return;

    const tempId = Date.now();
    const msg = {
      _id: tempId,
      senderId: myUserId,
      receiverId: selectedUser._id,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      seen: false,
      temp: true,
    };

    // Optimistically add message
    setMessages((prev) => [...prev, msg]);
    setText("");

    // Emit socket message
    socket.emit("sendMessage", {
      senderId: myUserId,
      receiverId: selectedUser._id,
      text: text.trim(),
    });

    try {
      const res = await API.post("/messages", {
        receiverId: selectedUser._id,
        text: text.trim(),
      });
      
      // Replace temp message with real one
      setMessages((prev) => 
        prev.map(m => m._id === tempId ? res.data : m)
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      // Remove failed message or mark as error
      setMessages((prev) => prev.filter(m => m._id !== tempId));
    }
  };

  const handleTyping = () => {
    if (!currentUser || !selectedUser || !myUserId) return;

    socket.emit("typing", {
      senderId: myUserId,
      receiverId: selectedUser._id,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", {
        senderId: myUserId,
        receiverId: selectedUser._id,
      });
    }, 1000);
  };

  // If user data isn't ready, show a placeholder
  if (!selectedUser) {
    return (
      <div className="chat-window-empty">
        <svg className="chat-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3>Select a conversation</h3>
        <p>Choose someone to start chatting with</p>
      </div>
    );
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
            {getProfileImageUrl(selectedUser) ? (
              <img
                src={getProfileImageUrl(selectedUser)}
                alt={selectedUser.username || selectedUser.name}
                className="avatar-img"
              />
            ) : (
              <div className="avatar-fallback">
                {selectedUser.name?.charAt(0)?.toUpperCase() || selectedUser.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <span className={`online-indicator ${peerOnline ? "online" : "offline"}`}></span>
          </div>
          <div className="chat-header-info">
            <h3 className="chat-header-name">{selectedUser.name || selectedUser.username}</h3>
            <p className="chat-header-status">
              {peerOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="chat-header-btn" title="Call">
            <Phone size={20} />
          </button>
          <button className="chat-header-btn" title="Info">
            <Info size={20} />
          </button>
          <button className="chat-header-btn" title="More">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-window-messages">
        <div className="messages">
          {loading ? (
            <div className="chat-loading">
              <div className="loading-spinner"></div>
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-no-messages">
              <div className="chat-no-messages-icon">💬</div>
              <p>No messages yet. Start the conversation!</p>
              <span>Say hello to {selectedUser.name || selectedUser.username}</span>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg._id || i}
                  message={msg}
                  isMe={isMessageFromMe(msg, currentUser)}
                  currentUser={currentUser}
                />
              ))}
              {isTyping && (
                <div className="typing-indicator">
                  <div className="typing-bubble">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="typing-text">{selectedUser.name} is typing...</span>
                </div>
              )}
            </>
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
            placeholder="Type a message... (Enter to send)"
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