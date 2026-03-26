// src/hooks/useSocket.js
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export const useSocket = (userId, onNotification) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const onNotificationRef = useRef(onNotification); // Store callback in ref

  // Update ref when callback changes
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!userId) {
      console.log("No userId provided, skipping socket connection");
      return;
    }

    // Only create socket if it doesn't exist
    if (socketRef.current) {
      console.log("Socket already exists, skipping reconnection");
      return;
    }

    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://tickispotbackend.onrender.com"
        : "http://localhost:8080");

    console.log(`Connecting to socket server: ${SOCKET_URL}`);

    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      query: { userId },
      withCredentials: true,
      forceNew: false, // Don't force new connection
    });

    // Connection event handlers
    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected successfully");
      setIsConnected(true);
      setConnectionError(null);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
      
      if (reason === "io server disconnect") {
        // Server disconnected, attempt to reconnect
        socketRef.current.connect();
      }
    });

    socketRef.current.on("reconnect", (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    });

    socketRef.current.on("reconnect_failed", () => {
      console.error("Socket reconnection failed");
      setConnectionError("Failed to reconnect to server");
    });

    // Listen for notification events using ref
    socketRef.current.on("notification", (data) => {
      console.log("📨 Received notification:", data);
      if (onNotificationRef.current && typeof onNotificationRef.current === "function") {
        onNotificationRef.current(data);
      }
    });

    socketRef.current.on("eventUpdate", (data) => {
      console.log("📅 Event update received:", data);
    });

    // Cleanup on unmount only
    return () => {
      if (socketRef.current) {
        console.log("Cleaning up socket connection");
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [userId]); // Only depend on userId, not onNotification

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
  };
};