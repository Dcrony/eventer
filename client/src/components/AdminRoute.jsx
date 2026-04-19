import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const location = useLocation();
  const { user, isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isAdmin = user?.role === "admin" || user?.isAdmin === true;

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

