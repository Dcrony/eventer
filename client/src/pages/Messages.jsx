// Messages.jsx
import { useEffect, useState } from "react";
import { MessageCircleMore } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const navigate = useNavigate();

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
      } catch (err) {}
    };
    fetchUser();
  }, [userIdFromQuery]);

  return (
    <div
      className="lg:pl-[var(--sidebar-width,0px)] font-geist"
      style={{ height: "100dvh", display: "flex", flexDirection: "column" }}
    >
      {/* On mobile: full-screen, no padding, no card wrapper */}
      {/* On desktop: padded card layout */}
      <div className="flex-1 overflow-hidden md:p-4 md:p-6 lg:p-8">
        <div
          className="h-full md:rounded-2xl md:border md:border-gray-200 md:shadow-sm overflow-hidden bg-white"
          style={{ display: "flex" }}
        >
          {/* Chat List */}
          <div
            className={`
              ${isMobile && selectedUser ? "hidden" : "flex"}
              flex-col
              w-full md:w-80 lg:w-96
              flex-shrink-0
              border-r border-gray-200
              bg-white
            `}
            style={{ height: "100%" }}
          >
            <ChatList
              setSelectedUser={setSelectedUser}
              selectedUser={selectedUser}
               isMobile={isMobile}
  onBack={() => navigate(-1)}
            />
          </div>

          {/* Chat Window */}
          <div
            className={`
              ${isMobile && !selectedUser ? "hidden" : "flex"}
              flex-1 flex-col
              w-full bg-gray-50
            `}
            style={{ height: "100%", minWidth: 0 }}
          >
            {selectedUser ? (
              <ChatWindow
                currentUser={user}
                selectedUser={selectedUser}
                isMobile={isMobile}
                onBack={() => setSelectedUser(null)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4 max-w-sm text-center">
                  <div className="w-20 h-20 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-500">
                    <MessageCircleMore size={40} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Select a conversation
                    </h3>
                    <p className="text-sm text-gray-500">
                      Choose someone from the list to read and send messages.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}