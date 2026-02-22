// src/hooks/useSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export const useSocket = (userId, onNotification) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://your-live-api-domain.com"
        : "http://localhost:8080");

    // ✅ connect socket
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
      query: { userId },
    });

    // ✅ listen for notification event
    socketRef.current.on("notification", (data) => {
      if (onNotification) onNotification(data);
    });

    // ✅ cleanup
    return () => {
      socketRef.current.disconnect();
    };
  }, [userId, onNotification]);

  return socketRef.current;
};
