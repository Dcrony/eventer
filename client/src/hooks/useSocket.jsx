import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:8080";

let socketSingleton = null;

const getSocketSingleton = () => {
  if (!socketSingleton) {
    socketSingleton = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
  }

  return socketSingleton;
};

export function SocketProvider({ children }) {
  const [authState, setAuthState] = useState(() => ({
    token: localStorage.getItem("token"),
    user: JSON.parse(localStorage.getItem("user") || "null"),
  }));
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const syncAuthState = () => {
      setAuthState({
        token: localStorage.getItem("token"),
        user: JSON.parse(localStorage.getItem("user") || "null"),
      });
    };

    window.addEventListener("userLogin", syncAuthState);
    window.addEventListener("userLogout", syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener("userLogin", syncAuthState);
      window.removeEventListener("userLogout", syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  useEffect(() => {
    const socket = getSocketSingleton();
    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (error) => {
      setConnectionError(error.message || "Socket connection failed");
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current || getSocketSingleton();
    const token = authState.token;

    if (!token) {
      if (socket.connected) {
        socket.disconnect();
      }
      setIsConnected(false);
      return;
    }

    socket.auth = { token };

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      if (!localStorage.getItem("token") && socket.connected) {
        socket.disconnect();
      }
    };
  }, [authState.token]);

  const value = useMemo(
    () => ({
      socket: socketRef.current || getSocketSingleton(),
      isConnected,
      connectionError,
      currentUser: authState.user,
      currentUserId: authState.user?.id || authState.user?._id || null,
    }),
    [authState.user, connectionError, isConnected],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }

  return context;
}
