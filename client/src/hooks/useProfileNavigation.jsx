import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";

const resolveUserId = (user) => {
  if (!user) return null;
  if (typeof user === "string") return user;
  return user._id || user.id || user.userId || null;
};

export default function useProfileNavigation() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentUserId = resolveUserId(currentUser);

  const toProfile = (user) => {
    const id = resolveUserId(user);
    if (!id) return;

    if (id === currentUserId) {
      navigate("/profile/me");
    } else {
      navigate(`/profile/${id}`);
    }
  };

  return { toProfile, currentUserId };
}
