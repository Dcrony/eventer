export default function MessageBubble({ message, isMe }) {
  return (
    <div className={isMe ? "bubble me" : "bubble them"}>
      <p>{message.text}</p>
      <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
    </div>
  );
}