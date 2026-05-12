import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircleMore, Send, Smile } from "lucide-react";
import MessageBubble from "./MessageBubble";
import API from "../../api/axios";
import useProfileNavigation from "../../hooks/useProfileNavigation";
import { useSocket } from "../../hooks/useSocket";
import { UserAvatar } from "../ui/avatar";

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
          senderId: msg.sender?._id ?? msg.sender,
          receiverId: msg.receiver?._id ?? msg.receiver,
          text: msg.text,
          createdAt: msg.createdAt,
          seen: msg.seen,
          temp: false,
        }));
        setMessages(formattedMessages);
        await API.put(`/messages/read/${selectedUser._id}`);
      } catch (err) {
        // Failed to fetch messages - UI will show empty state
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [currentUserId, selectedUser]);

  useEffect(() => {
    if (!currentUserId || !selectedUser || !socket) return;

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
          API.put(`/messages/read/${selectedUser._id}`).catch(() => {
            // Silently handle read status update failure
          });
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
    if (!text.trim() || !currentUserId || !selectedUser || !socket) return;

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

    socket.emit(
      "send_message",
      {
        receiverId: selectedUser._id,
        text: nextText,
        clientMessageId: tempId,
      },
      (response) => {
        if (!response?.ok) {
          console.error("Failed to send message:", response?.error);
          setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
          return;
        }

        setMessages((prev) =>
          prev.map((msg) => (msg._id === tempId ? { ...response.message, temp: false } : msg)),
        );
      },
    );
  };

  const handleTypingEmit = () => {
    if (!currentUserId || !selectedUser || !socket) return;

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
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center min-h-[300px]">
        <div className="w-14 h-14 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500">
          <MessageCircleMore size={32} strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-bold text-gray-900">Select a conversation</h3>
        <p className="text-xs text-gray-400">Choose someone to start chatting with</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-white flex-shrink-0">
        {isMobile && (
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 transition-all duration-200 hover:bg-pink-50 hover:text-pink-500"
            aria-label="Back to conversations"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <div
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer py-1 px-2 rounded-lg transition-all duration-200 hover:bg-gray-50"
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
          <div className="relative flex-shrink-0">
            <UserAvatar user={selectedUser} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${online ? "bg-green-500" : "bg-gray-300"}`} />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {selectedUser.name || selectedUser.username}
            </h3>
            <p className="text-xs text-gray-400">
              {online ? "Online now" : `@${selectedUser.username || "user"}`}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 space-y-2 min-h-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="w-8 h-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center min-h-[300px]">
              <div className="w-14 h-14 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500">
                <MessageCircleMore size={32} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-semibold text-gray-900">No messages yet</p>
              <p className="text-xs text-gray-400">
                Say hello to {selectedUser.name || selectedUser.username}
              </p>
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
              {isTyping && (
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden">
                    <UserAvatar user={selectedUser} className="w-full h-full" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-3 py-2 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{selectedUser.name} is typing...</span>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex-shrink-0 border-t border-gray-200 bg-white p-3 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 transition-all duration-200 hover:bg-pink-50 hover:text-pink-500"
            aria-label="Emoji picker"
          >
            <Smile size={18} />
          </button>
          <input
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              handleTypingEmit();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message"
            disabled={!currentUserId || !selectedUser || !isConnected}
            className="flex-1 px-4 py-2.5 rounded-full border-2 border-gray-200 bg-gray-50 text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            onClick={handleSend}
            disabled={!text.trim() || !currentUserId || !selectedUser}
            className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center transition-all duration-200 hover:bg-pink-600 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 shadow-md shadow-pink-500/30"
            title="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}