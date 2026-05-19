import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasAdminAccess } from "../utils/adminAccess";

/** Only users who can run check-in: organizers and admins. */
export default function OrganizerStaffRoute({ children }) {
  const location = useLocation();
  const { user, isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = user?.role;
  const ok =
    role === "organizer" ||
    hasAdminAccess(user) ||
    user?.isOrganizer === true;

  if (!ok) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
