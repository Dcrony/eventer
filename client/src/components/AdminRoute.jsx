import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasAdminAccess } from "../utils/adminAccess";

export default function AdminRoute({ children }) {
  const location = useLocation();
  const { user, isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isAdmin = hasAdminAccess(user);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

