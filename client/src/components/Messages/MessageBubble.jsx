import { Check, CheckCheck } from "lucide-react";
import { PORT_URL } from "../../utils/config";

export default function MessageBubble({ message, isMe }) {
  const formatTime = (date) => {
    if (!date) return "";

    const value = new Date(date);
    const now = new Date();
    const isToday = value.toDateString() === now.toDateString();

    return isToday
      ? value.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const status = message.temp ? "Sent" : message.seen ? "Seen" : "Delivered";

  return (
    <div className={`message-wrapper ${isMe ? "message-wrapper-me" : "message-wrapper-them"}`}>
      {!isMe ? (
        <div className="message-avatar">
          {message.sender?.profilePic ? (
            <img
              src={
                message.sender.profilePic.startsWith("http")
                  ? message.sender.profilePic
                  : `${PORT_URL}/uploads/profile_pic/${message.sender.profilePic}`
              }
              alt={message.sender.name}
            />
          ) : (
            <div className="avatar-fallback-small">
              {message.sender?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
        </div>
      ) : null}

      <div className={`message-bubble ${isMe ? "message-bubble-me" : "message-bubble-them"}`}>
        {!isMe && message.sender?.name ? (
          <div className="message-sender-name">{message.sender.name}</div>
        ) : null}

        <div className="message-bubble-content">
          <p className="message-text">{message.text}</p>
          <div className="message-meta">
            <span className="message-time">{formatTime(message.createdAt)}</span>
            {isMe ? (
              <span className={`message-status ${status.toLowerCase()}`}>
                {message.seen ? <CheckCheck size={14} /> : <Check size={14} />}
                {status}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
