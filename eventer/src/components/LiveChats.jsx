import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function LiveChat({ eventId, username }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const socket = io("http://localhost:5000");
    socketRef.current = socket;

    socket.emit("joinRoom", eventId);

    const joinMessage = {
      eventId,
      username,
      text: `${username} joined the chat.`,
      system: true,
      timestamp: new Date(),
    };
    socket.emit("sendMessage", joinMessage);

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [eventId, username]);

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
    <div className="w-full max-w-md border rounded-2xl shadow-md bg-white flex flex-col h-96">
      {/* Header */}
      <div className="p-3 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-t-2xl">
        💬 Live Chat
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.system ? (
              <p className="text-gray-400 italic text-center">{msg.text}</p>
            ) : (
              <div
                className={`flex ${
                  msg.username === username ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm shadow ${
                    msg.username === username
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <span className="font-semibold">{msg.username}: </span>
                  {msg.text}
                  <div className="text-xs mt-1 opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {/* Only one scroll ref here */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-lg shadow transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
