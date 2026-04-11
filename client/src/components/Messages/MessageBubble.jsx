export default function MessageBubble({ message, isMe, currentUser }) {
  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    if (isToday) {
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    } else {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === now.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  };

  const showDateSeparator = (currentIndex) => {
    // Logic to show date separator can be added here
    return false;
  };

  return (
    <div className={`message-wrapper ${isMe ? "message-wrapper-me" : "message-wrapper-them"}`}>
      {!isMe && (
        <div className="message-avatar">
          {message.sender?.profilePic ? (
            <img src={message.sender.profilePic} alt={message.sender.name} />
          ) : (
            <div className="avatar-fallback-small">
              {message.sender?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
        </div>
      )}
      <div className={`message-bubble ${isMe ? "message-bubble-me" : "message-bubble-them"}`}>
        {!isMe && message.sender?.name && (
          <div className="message-sender-name">{message.sender.name}</div>
        )}
        <div className="message-bubble-content">
          <p className="message-text">{message.text}</p>
          <div className="message-meta">
            <span className="message-time">{formatTime(message.createdAt)}</span>
            {isMe && (
              <span className="message-status">
                {message.seen ? "✓✓" : "✓"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}