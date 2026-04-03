import { useState } from "react";
import API from "../../api/axios";

export default function FollowButton({ userId, isFollowing }) {
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    try {
      setLoading(true);
      await API.post(`/users/${userId}/follow`);
      setFollowing(!following);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleFollow} disabled={loading}>
      {following ? "Unfollow" : "Follow"}
    </button>
  );
}