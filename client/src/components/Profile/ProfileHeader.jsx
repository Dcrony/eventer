import { Edit2, Mail, MoreVertical, MapPin, CalendarDays, Link2 } from "lucide-react";
import { Link } from "react-router-dom";
import FollowButton from "./FollowButton";
import { UserAvatar } from "../ui/avatar";
import VerifiedBadge from "../ui/verified-badge";

export default function ProfileHeader({ user, isOwner, onEdit, onMessage }) {
  const formatJoinDate = (date) => {
    if (!date) return "Joined recently";
    return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="relative">
      {/* Cover Image */}
      {user.coverPic && (
        <div className="relative h-48 md:h-56 w-full overflow-hidden rounded-t-2xl">
          <img
            src={user.coverPic}
            alt={`${user.name || user.username}'s cover`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>
      )}

      <div className={`relative px-4 sm:px-6 pb-6 ${user.coverPic ? "-mt-16" : "pt-4"}`}>
        {/* Avatar */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
              <UserAvatar
                user={user}
                name={user?.name || user?.username}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {isOwner ? (
              <>
                <button
                  onClick={onEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-gray-200 bg-white text-gray-700 text-sm font-semibold transition-all duration-200 hover:border-pink-300 hover:text-pink-500"
                >
                  <Edit2 size={14} />
                  Edit Profile
                </button>
                <button className="inline-flex items-center justify-center w-9 h-9 rounded-full border-2 border-gray-200 bg-white text-gray-600 transition-all duration-200 hover:border-pink-300 hover:text-pink-500">
                  <MoreVertical size={16} />
                </button>
              </>
            ) : (
              <>
                <FollowButton userId={user._id} isFollowing={user.isFollowing} size="md" />
                <button
                  onClick={onMessage}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-gray-200 bg-white text-gray-700 text-sm font-semibold transition-all duration-200 hover:border-pink-300 hover:text-pink-500"
                >
                  <Mail size={14} />
                  Message
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="mt-4 space-y-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                {user.name || user.username}
              </h1>
              <VerifiedBadge user={user} />
            </div>
            {user.username && (
              <p className="text-sm text-gray-500 mt-0.5">@{user.username}</p>
            )}
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-gray-700 leading-relaxed max-w-2xl">{user.bio}</p>
          )}

          {/* Location & Join Date */}
          <div className="flex flex-wrap gap-4">
            {user.location && (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin size={14} className="text-pink-500" />
                {user.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
              <CalendarDays size={14} className="text-pink-500" />
              {formatJoinDate(user.createdAt)}
            </span>
            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-pink-500 hover:underline"
              >
                <Link2 size={14} />
                {user.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 pt-2">
            <button className="group text-left">
              <span className="block text-sm font-bold text-gray-900 group-hover:text-pink-500 transition-colors">
                {user.stats?.followers?.toLocaleString() || 0}
              </span>
              <span className="text-xs text-gray-500">Followers</span>
            </button>
            <button className="group text-left">
              <span className="block text-sm font-bold text-gray-900 group-hover:text-pink-500 transition-colors">
                {user.stats?.following?.toLocaleString() || 0}
              </span>
              <span className="text-xs text-gray-500">Following</span>
            </button>
            <button className="group text-left">
              <span className="block text-sm font-bold text-gray-900 group-hover:text-pink-500 transition-colors">
                {user.stats?.events?.toLocaleString() || 0}
              </span>
              <span className="text-xs text-gray-500">Events</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}