import { useState } from "react";
import API from "../../api/axios";
import { UserPlus, UserCheck } from "lucide-react";

export default function FollowButton({ userId, isFollowing, size = "md" }) {
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

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all duration-200 ${
        following
          ? "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:border-gray-400"
          : "bg-pink-500 text-white shadow-md shadow-pink-500/25 hover:bg-pink-600 hover:-translate-y-0.5"
      } ${sizeClasses[size]} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : following ? (
        <>
          <UserCheck size={size === "sm" ? 12 : 14} />
          Following
        </>
      ) : (
        <>
          <UserPlus size={size === "sm" ? 12 : 14} />
          Follow
        </>
      )}
    </button>
  );
}