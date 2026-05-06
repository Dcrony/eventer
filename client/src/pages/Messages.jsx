import { useEffect, useState } from "react";
import { MessageCircleMore } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ChatList from "../components/Messages/ChatList";
import ChatWindow from "../components/Messages/ChatWindow";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./CSS/Messages.css";

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
    <div className="dashboard-page messages-page">
      <div className="messages-container">
        {(!isMobile || !selectedUser) && (
          <aside className="messages-sidebar">
            <ChatList setSelectedUser={setSelectedUser} selectedUser={selectedUser} />
          </aside>
        )}

        {(!isMobile || selectedUser) && (
          <section className="messages-main">
            {selectedUser ? (
              <ChatWindow
                currentUser={user}
                selectedUser={selectedUser}
                isMobile={isMobile}
                onBack={() => setSelectedUser(null)}
              />
            ) : (
              <div className="messages-empty">
                <div className="messages-empty-content">
                  <div className="messages-empty-icon" aria-hidden>
                    <MessageCircleMore size={36} strokeWidth={1.5} />
                  </div>
                  <h3>Select a conversation</h3>
                  <p>Choose someone from the list to read and send messages.</p>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
