import { useState } from "react";
import ChatList from "../components/Messages/ChatList";
import ChatWindow from "../components/Messages/ChatWindow";

export default function MessagesPage({ user }) {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="messages-page">
      <ChatList setSelectedUser={setSelectedUser} />
      {selectedUser && (
        <ChatWindow
          currentUser={user}
          selectedUser={selectedUser}
        />
      )}
    </div>
  );
}