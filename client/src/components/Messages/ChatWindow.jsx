// ChatWindow.jsx
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
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [currentUserId, selectedUser]);

  useEffect(() => {
    if (!currentUserId || !selectedUser || !socket) return;

    socket.emit("join_conversation", { participantId: selectedUser._id }, (res) => {
      if (res?.ok) setOnline(Boolean(res.online));
    });
    socket.emit("check_presence", { userId: selectedUser._id }, (res) => {
      if (res?.ok) setOnline(Boolean(res.online));
    });

    const handleReceiveMessage = (data) => {
      const isCurrentConversation =
        (data.senderId === selectedUser._id && data.receiverId === currentUserId) ||
        (data.senderId === currentUserId && data.receiverId === selectedUser._id);
      if (isCurrentConversation) {
        setMessages((prev) => {
          const idx = prev.findIndex(
            (m) =>
              m._id === data._id ||
              (data.clientMessageId && m._id === data.clientMessageId) ||
              (data.clientMessageId && m.clientMessageId === data.clientMessageId)
          );
          if (idx >= 0) return prev.map((m, i) => (i === idx ? { ...data, temp: false } : m));
          return [...prev, { ...data, temp: false }];
        });
        if (data.senderId === selectedUser._id) {
          API.put(`/messages/read/${selectedUser._id}`).catch(() => {});
        }
      }
    };

    const handleTyping = ({ senderId }) => {
      if (senderId === selectedUser._id) setIsTyping(true);
    };
    const handleStopTyping = ({ senderId }) => {
      if (senderId === selectedUser._id) setIsTyping(false);
    };
    const handleConversationUpdate = (payload) => {
      if (payload?.type === "read_receipt" && payload.readerId === selectedUser._id) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === currentUserId ? { ...m, seen: true, temp: false } : m))
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
      { receiverId: selectedUser._id, text: nextText, clientMessageId: tempId },
      (response) => {
        if (!response?.ok) {
          setMessages((prev) => prev.filter((m) => m._id !== tempId));
          return;
        }
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? { ...response.message, temp: false } : m))
        );
      }
    );
  };

  const handleTypingEmit = () => {
    if (!currentUserId || !selectedUser || !socket) return;
    socket.emit("typing_start", { receiverId: selectedUser._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", { receiverId: selectedUser._id });
    }, 1000);
  };

  if (!selectedUser) return null;

  return (
    // flex-col fills full height; no overflow on this container
    <div className="flex flex-col h-full w-full">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-200 bg-white shrink-0">
        {isMobile && (
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-pink-50 hover:text-pink-500 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <div
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer py-1 px-2 rounded-lg hover:bg-gray-50 transition-all"
          onClick={() => toProfile(selectedUser)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toProfile(selectedUser);
            }
          }}
        >
          <div className="relative flex-shrink-0">
            <UserAvatar user={selectedUser} className="w-10 h-10 rounded-full" />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                online ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {selectedUser.name || selectedUser.username}
            </h3>
            <p className="text-xs text-gray-500">
              {online ? "Online now" : `@${selectedUser.username || "user"}`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto bg-gray-50"
        style={{ padding: "12px 16px" }}
      >
        <div className="flex flex-col gap-2 min-h-full justify-end">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-[3px] border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 mb-3">
                <MessageCircleMore size={32} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-semibold text-gray-900">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Say hello to {selectedUser.name || selectedUser.username}
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <MessageBubble
                  key={msg._id || index}
                  message={msg}
                  isMe={
                    msg.senderId === currentUserId ||
                    msg.sender?._id === currentUserId
                  }
                />
              ))}
              {isTyping && (
                <div className="flex items-end gap-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden">
                    <UserAvatar user={selectedUser} className="w-full h-full" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-3 py-2.5 shadow-sm">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 0.2, 0.4].map((delay) => (
                        <span
                          key={delay}
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                          style={{
                            animation: "typingBounce 1.4s infinite",
                            animationDelay: `${delay}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input ──────────────────────────────────────────────── */}
      <div
        className="shrink-0 border-t border-gray-200 bg-white"
        style={{ padding: "8px 12px", paddingBottom: "calc(8px + env(safe-area-inset-bottom))" }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-pink-50 hover:text-pink-500 transition-all flex-shrink-0"
          >
            <Smile size={18} />
          </button>

          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTypingEmit();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message"
            disabled={!currentUserId || !selectedUser || !isConnected}
            className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none disabled:opacity-50 transition-all"
          />

          <button
            type="submit"
            disabled={!text.trim() || !currentUserId || !selectedUser}
            className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 shadow-md shadow-pink-500/30 transition-all flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}