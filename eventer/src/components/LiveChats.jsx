import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./css/LiveChat.css";

export default function LiveChat({ eventId, username }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize socket
    const socket = io("http://localhost:5000");
    socketRef.current = socket;

    // Join event room
    socket.emit("joinRoom", eventId);

    // Send join message to others
    const joinMessage = {
      eventId,
      username,
      text: `${username} joined the chat.`,
      system: true,
      timestamp: new Date(),
    };
    socket.emit("sendMessage", joinMessage);

    // Listen for new messages
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [eventId, username]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (message.trim()) {
      const msgData = {
        eventId,
        username,
        text: message,
        timestamp: new Date(),
      };
      socketRef.current.emit("sendMessage", msgData);
      setMessages((prev) => [...prev, msgData]);
      setMessage("");
    }
  };

  return (
    <div
      className="livechat"
      style={{ border: "1px solid #ccc", padding: 10, maxWidth: 400 }}
    >
      <h4>💬 Live Chat</h4>
      <div
        className="messagebox"
        style={{ maxHeight: 200, overflowY: "auto", marginBottom: 10 }}
      >
        {messages.map((msg, i) => (
          <div key={i}>
            <div ref={messagesEndRef} />
            {msg.system ? (
              <em style={{ color: "gray" }}>{msg.text}</em>
            ) : (
              <div
                className={`message ${
                  msg.username === username ? "sender" : "receiver"
                }`}
              >
                <strong>{msg.username}:</strong> {msg.text}{" "}
                <span style={{ fontSize: "0.75em", color: "gray" }}>
                  ({new Date(msg.timestamp).toLocaleTimeString()})
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="chatinput">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="Type a message"
          style={{ width: "100%", padding: 5 }}
        />
        <button onClick={sendMessage} style={{ marginTop: 5 }}>
          Send
        </button>
      </div>
    </div>
  );
}
