import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function EventDetailRedirect() {
  const { eventId } = useParams();
  return <Navigate to={`/event/${eventId}`} replace />;
}

export function ProfileMeRedirect() {
  const { user } = useAuth();
  if (user?.username) {
    return <Navigate to={`/user/${user.username}`} replace />;
  }
  return <Navigate to="/settings" replace />;
}
