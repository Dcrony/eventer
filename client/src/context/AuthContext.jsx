import { createContext, useContext, useEffect, useMemo, useState } from "react";
import API from "../api/axios";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => readStoredUser());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const persistAuth = (nextUser, nextToken) => {
    if (nextToken) {
      localStorage.setItem("token", nextToken);
      setToken(nextToken);
    }

    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
      setUser(nextUser);
    }

    window.dispatchEvent(new CustomEvent("userLogin"));
  };

  const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    window.dispatchEvent(new CustomEvent("userLogout"));
  };

  const refreshUser = async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      clearAuth();
      return null;
    }

    try {
      const { data } = await API.get("/users/me");
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      setToken(currentToken);
      return data;
    } catch (error) {
      clearAuth();
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const existingToken = localStorage.getItem("token");
      if (!existingToken) {
        if (mounted) setIsBootstrapping(false);
        return;
      }

      try {
        const { data } = await API.get("/users/me");
        if (!mounted) return;
        setUser(data);
        setToken(existingToken);
        localStorage.setItem("user", JSON.stringify(data));
      } catch {
        if (!mounted) return;
        clearAuth();
      } finally {
        if (mounted) setIsBootstrapping(false);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isBootstrapping,
      login: persistAuth,
      logout: clearAuth,
      refreshUser,
    }),
    [token, user, isBootstrapping],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
