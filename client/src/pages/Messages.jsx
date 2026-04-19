import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ChatList from "../components/Messages/ChatList";
import ChatWindow from "../components/Messages/ChatWindow";
import API from "../api/axios";
import { getCurrentUser } from "../utils/auth";
import socket from "../socket";
import { isUserOnline } from "../utils/messaging";
import "./CSS/Messages.css";

export default function Messages() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [searchParams] = useSearchParams();
  const userIdFromQuery = searchParams.get("user");
  const user = getCurrentUser();
  const myUserId = user?.id ?? user?._id;

  // Register with Socket.IO presence (server uses addUser + getOnlineUsers)
  useEffect(() => {
    if (!myUserId) return;

    const onOnlineUsers = (ids) => {
      setOnlineUserIds(Array.isArray(ids) ? ids : []);
    };

    const registerPresence = () => {
      socket.emit("addUser", myUserId);
      socket.emit("requestOnlineUsers");
    };

    socket.on("getOnlineUsers", onOnlineUsers);
    socket.on("connect", registerPresence);
    registerPresence();

    return () => {
      socket.off("getOnlineUsers", onOnlineUsers);
      socket.off("connect", registerPresence);
    };
  }, [myUserId]);

  // auto select user if query param exists
  useEffect(() => {
    if (!userIdFromQuery) return;

    const fetchUser = async () => {
      try {
        const res = await API.get(`/users/${userIdFromQuery}`);
        setSelectedUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user from query", err);
      }
    };

    fetchUser();
  }, [userIdFromQuery]);

  return (
    <div className="dashboard-page messages-page">
      <div className="messages-container">
        <div className="messages-sidebar">
          <ChatList
            setSelectedUser={setSelectedUser}
            selectedUser={selectedUser}
            onlineUserIds={onlineUserIds}
          />
        </div>
        <div className="messages-main">
          {selectedUser ? (
            <ChatWindow
              currentUser={user}
              selectedUser={selectedUser}
              peerOnline={isUserOnline(onlineUserIds, selectedUser._id)}
            />
          ) : (
            <div className="messages-empty">
              <div className="messages-empty-content">
                <svg className="messages-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3>No conversation selected</h3>
                <p>Choose a chat from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}