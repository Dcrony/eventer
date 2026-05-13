import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ArrowLeft, MessageCircleMore, Search } from "lucide-react";
import API from "../../api/axios";
import { useSocket } from "../../hooks/useSocket";
import { UserAvatar } from "../ui/avatar";
import { isUserOnline } from "../../utils/messaging";

export default function ChatList({ setSelectedUser, selectedUser, onlineUserIds = [], isMobile, onBack }) {
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const deferredSearch = useDeferredValue(searchTerm);
  const { socket, currentUserId } = useSocket();

  const formatChatUser = (u) => ({
    _id: u.id || u._id,
    name: u.name,
    username: u.username,
    profilePic: u.profilePic,
  });

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const res = await API.get("/messages");
        const formattedChats = res.data.map((chat) => ({
          ...chat,
          user: formatChatUser(chat.user),
        }));
        setChats(formattedChats);
      } catch (err) {
        console.error("Failed to fetch chats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  useEffect(() => {
    if (!socket || !currentUserId) return;

    const refreshChats = async () => {
      try {
        const res = await API.get("/messages");
        const formattedChats = res.data.map((chat) => ({
          ...chat,
          user: formatChatUser(chat.user),
        }));
        setChats(formattedChats);
      } catch (err) {
        console.error("Failed to refresh chats:", err);
      }
    };

    socket.on("conversation_update", refreshChats);
    return () => socket.off("conversation_update", refreshChats);
  }, [currentUserId, socket]);

  const allConversations = [...chats];
  if (selectedUser && !chats.find((chat) => chat.user._id === selectedUser._id)) {
    allConversations.unshift({
      user: formatChatUser(selectedUser),
      lastMessage: null,
      unreadCount: 0,
    });
  }

  const filteredChats = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();
    if (!normalized) return allConversations;

    return allConversations.filter(
      (chat) =>
        chat.user.name?.toLowerCase().includes(normalized) ||
        chat.user.username?.toLowerCase().includes(normalized),
    );
  }, [allConversations, deferredSearch]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          <p className="text-xs text-gray-500 mt-0.5">Loading your conversations…</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
    {/* Header */}
<div className="p-4 border-b border-gray-200 bg-white">
  <div className="flex items-center gap-2">
    {isMobile && onBack && (
      <button
        type="button"
        onClick={onBack}
        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-pink-50 hover:text-pink-500 transition-all flex-shrink-0"
      >
        <ArrowLeft size={18} />
      </button>
    )}
    <div className="min-w-0">
      <h2 className="text-lg font-bold text-gray-900">Messages</h2>
      <p className="text-xs text-gray-500 mt-0.5">
        {filteredChats.length} conversation{filteredChats.length === 1 ? "" : "s"}
      </p>
    </div>
  </div>
</div>

      {/* Search */}
      <div className="p-3">
        <div className="flex items-center gap-2 px-3 h-10 rounded-full border border-gray-200 bg-gray-50 transition-all duration-200 focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-100">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search conversations"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-gray-900 text-sm placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center min-h-[200px]">
            <div className="w-14 h-14 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500">
              <MessageCircleMore size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">No conversations found</p>
              <p className="text-xs text-gray-400 mt-1">Start a new conversation by visiting someone's profile</p>
            </div>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <button
              key={chat.user._id}
              type="button"
              onClick={() => setSelectedUser(chat.user)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
                selectedUser?._id === chat.user._id
                  ? "bg-pink-50 border border-pink-200"
                  : "hover:bg-gray-50 active:scale-[0.98]"
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <UserAvatar
                  user={chat.user}
                  name={chat.user.name || chat.user.username || "User"}
                  className="w-12 h-12 rounded-full"
                />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    isUserOnline(onlineUserIds, chat.user._id) ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {chat.user.name || chat.user.username}
                  </h4>
                  {chat.lastMessage?.createdAt && (
                    <span className="text-[0.65rem] text-gray-400 flex-shrink-0">
                      {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-xs text-gray-400 truncate flex-1">
                    {chat.lastMessage?.text || "Start a conversation"}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-pink-500 text-white text-[0.65rem] font-bold flex items-center justify-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}