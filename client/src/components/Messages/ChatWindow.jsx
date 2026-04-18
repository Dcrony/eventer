import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Smile } from "lucide-react";
import MessageBubble from "./MessageBubble";
import API from "../../api/axios";
import useProfileNavigation from "../../hooks/useProfileNavigation";
import { useSocket } from "../../hooks/useSocket";
import { PORT_URL } from "../../utils/config";

export default function ChatWindow({ currentUser, selectedUser, onBack, isMobile }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(false);
  const { toProfile } = useProfileNavigation();
  const { socket, isConnected } = useSocket();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    if (!currentUserId || !selectedUser) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/messages/${selectedUser._id}`);
        const formattedMessages = res.data.map((msg) => ({
          ...msg,
          senderId: msg.sender?._id || msg.sender,
          receiverId: msg.receiver?._id || msg.receiver,
          text: msg.text,
          createdAt: msg.createdAt,
          seen: msg.seen,
          temp: false,
        }));
        setMessages(formattedMessages);
        await API.put(`/messages/read/${selectedUser._id}`);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [currentUserId, selectedUser]);

  useEffect(() => {
    if (!currentUserId || !selectedUser) return;

    socket.emit("join_conversation", { participantId: selectedUser._id }, (response) => {
      if (response?.ok) {
        setOnline(Boolean(response.online));
      }
    });

    socket.emit("check_presence", { userId: selectedUser._id }, (response) => {
      if (response?.ok) {
        setOnline(Boolean(response.online));
      }
    });

    const handleReceiveMessage = (data) => {
      const isCurrentConversation =
        (data.senderId === selectedUser._id && data.receiverId === currentUserId) ||
        (data.senderId === currentUserId && data.receiverId === selectedUser._id);

      if (isCurrentConversation) {
        setMessages((prev) => {
          const existingIndex = prev.findIndex(
            (message) =>
              message._id === data._id ||
              (data.clientMessageId && message._id === data.clientMessageId) ||
              (data.clientMessageId && message.clientMessageId === data.clientMessageId),
          );

          if (existingIndex >= 0) {
            return prev.map((message, index) => (index === existingIndex ? { ...data, temp: false } : message));
          }

          return [...prev, { ...data, temp: false }];
        });

        if (data.senderId === selectedUser._id) {
          API.put(`/messages/read/${selectedUser._id}`).catch(console.error);
        }
      }
    };

    const handleTyping = ({ senderId }) => {
      if (senderId === selectedUser._id) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({ senderId }) => {
      if (senderId === selectedUser._id) {
        setIsTyping(false);
      }
    };

    const handleConversationUpdate = (payload) => {
      if (payload?.type === "read_receipt" && payload.readerId === selectedUser._id) {
        setMessages((prev) =>
          prev.map((message) =>
            message.senderId === currentUserId ? { ...message, seen: true, temp: false } : message,
          ),
        );
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("typing_start", handleTyping);
    socket.on("typing_stop", handleStopTyping);
    socket.on("conversation_update", handleConversationUpdate);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("typing_start", handleTyping);
      socket.off("typing_stop", handleStopTyping);
      socket.off("conversation_update", handleConversationUpdate);
      socket.emit("leave_conversation", { participantId: selectedUser._id });
    };
  }, [currentUserId, selectedUser, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!text.trim() || !currentUserId || !selectedUser) return;

    const nextText = text.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      clientMessageId: tempId,
      senderId: currentUserId,
      receiverId: selectedUser._id,
      text: nextText,
      createdAt: new Date().toISOString(),
      seen: false,
      temp: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setText("");

    socket.emit("send_message", {
      receiverId: selectedUser._id,
      text: nextText,
      clientMessageId: tempId,
    }, (response) => {
      if (!response?.ok) {
        console.error("Failed to send message:", response?.error);
        setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
        return;
      }

      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? { ...response.message, temp: false } : msg)),
      );
    });
  };

  const handleTyping = () => {
    if (!currentUserId || !selectedUser) return;

    socket.emit("typing_start", {
      receiverId: selectedUser._id,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", {
        receiverId: selectedUser._id,
      });
    }, 1000);
  };

  if (!selectedUser) {
    return (
      <div className="chat-window-empty">
        <h3>Select a conversation</h3>
        <p>Choose someone to start chatting with</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        {isMobile ? (
          <button type="button" className="chat-back-button" onClick={onBack} aria-label="Back to conversations">
            <ArrowLeft size={18} />
          </button>
        ) : null}

        <div
          className="chat-header-user"
          role="button"
          tabIndex={0}
          onClick={() => toProfile(selectedUser)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toProfile(selectedUser);
            }
          }}
        >
          <div className="chat-header-avatar">
            {selectedUser.profilePic ? (
              <img
                src={
                  selectedUser.profilePic.startsWith("http")
                    ? selectedUser.profilePic
                    : `${PORT_URL}/uploads/profile_pic/${selectedUser.profilePic}`
                }
                alt={selectedUser.username || selectedUser.name}
                className="avatar-img"
              />
            ) : (
              <div className="avatar-fallback">
                {selectedUser.name?.charAt(0)?.toUpperCase() ||
                  selectedUser.username?.charAt(0)?.toUpperCase() ||
                  "U"}
              </div>
            )}
            <span className={`online-indicator ${online ? "online" : "offline"}`}></span>
          </div>

          <div className="chat-header-info">
            <h3 className="chat-header-name">{selectedUser.name || selectedUser.username}</h3>
            <p className="chat-header-status">{online ? "Online now" : `@${selectedUser.username || "user"}`}</p>
          </div>
        </div>
      </div>

      <div className="chat-window-messages">
        <div className="messages">
          {loading ? (
            <div className="chat-loading">
              <div className="loading-spinner"></div>
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-no-messages">
              <div className="chat-no-messages-icon">...</div>
              <p>No messages yet. Start the conversation.</p>
              <span>Say hello to {selectedUser.name || selectedUser.username}</span>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <MessageBubble
                  key={msg._id || index}
                  message={msg}
                  isMe={msg.senderId === currentUserId || msg.sender?._id === currentUserId}
                />
              ))}
              {isTyping ? (
                <div className="typing-indicator">
                  <div className="typing-bubble">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="typing-text">{selectedUser.name} is typing...</span>
                </div>
              ) : null}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="chat-input-area">
        <div className="chat-input">
          <button type="button" className="chat-input-icon" aria-label="Emoji picker">
            <Smile size={18} />
          </button>
          <input
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              handleTyping();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message"
            disabled={!currentUserId || !selectedUser || !isConnected}
            className="chat-input-field"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || !currentUserId || !selectedUser}
            className="chat-send-btn"
            title="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
