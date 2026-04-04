import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import socket from "../../socket";
import API from "../../api/axios";

export default function ChatWindow({ currentUser, selectedUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef();

  // Fetch messages when selectedUser changes
  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    const fetchMessages = async () => {
      try {
        const res = await API.get(`/messages/${selectedUser._id}`);
        setMessages(res.data);
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

    return () => socket.off();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
  if (!currentUser || !selectedUser) {
    return <div className="chat-window">Select a user to start chatting...</div>;
  }

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} ref={scrollRef}>
            <MessageBubble
              message={msg}
              isMe={msg.sender === currentUser._id || msg.senderId === currentUser._id}
            />
          </div>
        ))}
        {typing && <p className="typing">Typing...</p>}
      </div>

      <div className="chat-input">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
          disabled={!currentUser || !selectedUser}
        />
        <button onClick={handleSend} disabled={!currentUser || !selectedUser}>
          Send
        </button>
      </div>
    </div>
  );
}