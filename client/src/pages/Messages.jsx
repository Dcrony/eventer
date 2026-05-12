import { useEffect, useState } from "react";
import { MessageCircleMore } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ChatList from "../components/Messages/ChatList";
import ChatWindow from "../components/Messages/ChatWindow";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Messages() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchParams] = useSearchParams();
  const userIdFromQuery = searchParams.get("user");
  const { user } = useAuth();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!userIdFromQuery) return;

    const fetchUser = async () => {
      try {
        const res = await API.get(`/users/${userIdFromQuery}`);
        setSelectedUser(res.data);
      } catch (err) {
        // Failed to fetch user - will show empty state
      }
    };

    fetchUser();
  }, [userIdFromQuery]);

  return (
    // Only apply sidebar padding on desktop screens (lg and above)
    <div className="min-h-screen bg-gray-50 font-geist pt-8 lg:pl-[var(--sidebar-width,0px)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] h-[calc(100vh-6rem)] max-w-6xl mx-auto rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-md">
          {/* Sidebar - Chat List */}
          {(!isMobile || !selectedUser) && (
            <aside className="flex flex-col h-full border-r border-gray-200 bg-gray-50/30">
              <ChatList setSelectedUser={setSelectedUser} selectedUser={selectedUser} />
            </aside>
          )}

          {/* Main Chat Area */}
          {(!isMobile || selectedUser) && (
            <section className="flex flex-col h-full bg-gray-50">
              {selectedUser ? (
                <ChatWindow
                  currentUser={user}
                  selectedUser={selectedUser}
                  isMobile={isMobile}
                  onBack={() => setSelectedUser(null)}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="flex flex-col items-center gap-3 max-w-xs text-center">
                    <div className="w-16 h-16 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500">
                      <MessageCircleMore size={36} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Select a conversation</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Choose someone from the list to read and send messages.
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}