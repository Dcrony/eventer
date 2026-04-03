import { useEffect, useRef, useState } from "react";
import socket from "../socket";
import API from "../api/axios";
import "./CSS/ChatPage.css";

export default function ChatPage({ user, selectedUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef();

  // connect user
  useEffect(() => {
    socket.emit("addUser", user._id);
  }, [user]);

  // receive message
  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("typing", () => setTyping(true));
    socket.on("stopTyping", () => setTyping(false));

    return () => {
      socket.off();
    };
  }, []);

  // load messages
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      const res = await API.get(`/messages/${selectedUser._id}`);
      setMessages(res.data);
    };

    fetchMessages();
  }, [selectedUser]);

  // auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;

    const msg = {
      senderId: user._id,
      receiverId: selectedUser._id,
      text,
    };

    // emit socket
    socket.emit("sendMessage", msg);

    // save to DB
    await API.post("/messages", {
      receiverId: selectedUser._id,
      text,
    });

    setMessages((prev) => [...prev, msg]);
    setText("");
  };

  const handleTyping = () => {
    socket.emit("typing", {
      senderId: user._id,
      receiverId: selectedUser._id,
    });

    setTimeout(() => {
      socket.emit("stopTyping", {
        senderId: user._id,
        receiverId: selectedUser._id,
      });
    }, 1000);
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((m, i) => (
          <div
            key={i}
            ref={scrollRef}
            className={m.senderId === user._id ? "me" : "them"}
          >
            {m.text}
          </div>
        ))}
        {typing && <p>Typing...</p>}
      </div>

      <div className="input">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}