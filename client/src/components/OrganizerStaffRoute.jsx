import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser, isAuthenticated } from "../utils/auth";

/** Only users who can run check-in: organizers and admins. */
export default function OrganizerStaffRoute({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const user = getCurrentUser();
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
