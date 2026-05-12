import { Check, CheckCheck } from "lucide-react";
import { UserAvatar } from "../ui/avatar";

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
    <div className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
      {!isMe && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden">
          <UserAvatar user={message.sender} className="w-full h-full" />
        </div>
      )}

      <div className={`max-w-[78%] sm:max-w-[420px] ${isMe ? "order-1" : ""}`}>
        {!isMe && message.sender?.name && (
          <p className="text-xs font-semibold text-gray-400 ml-2 mb-0.5">{message.sender.name}</p>
        )}

        <div
          className={`rounded-2xl px-3 py-2 shadow-sm ${
            isMe
              ? "bg-pink-500 text-white rounded-br-md"
              : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
          }`}
        >
          <p className="text-sm leading-relaxed break-words m-0">{message.text}</p>
          <div className={`flex items-center gap-1 mt-0.5 text-[0.65rem] ${isMe ? "justify-end" : "ml-2"}`}>
            <span className={isMe ? "text-white/80" : "text-gray-400"}>
              {formatTime(message.createdAt)}
            </span>
            {isMe && (
              <span className={`inline-flex items-center ${message.seen ? "text-white" : "text-white/70"}`} title={status}>
                {message.seen ? <CheckCheck size={12} strokeWidth={2.5} /> : <Check size={12} strokeWidth={2.5} />}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}