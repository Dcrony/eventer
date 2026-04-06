import { useContext } from "react";
import { ThemeContext } from "../../contexts/ThemeContexts";

export default function MessageBubble({ message, isMe, currentUser }) {
  const { darkMode } = useContext(ThemeContext);
  
  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={`message-bubble ${isMe ? "message-bubble-me" : "message-bubble-them"} ${darkMode ? "dark-mode" : ""}`}>
      <div className="message-bubble-content">
        <p className="message-text">{message.text}</p>
        <span className="message-time">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}