import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
    role === "admin" ||
    user?.isAdmin === true ||
    user?.isOrganizer === true;

  if (!ok) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
