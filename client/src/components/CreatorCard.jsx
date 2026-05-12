import { useState } from "react";
import Avatar from "./ui/avatar";
import { getProfileImageUrl } from "../utils/eventHelpers";
import Badge from "./ui/badge";
import Button from "./ui/button";
import { UserPlus, UserCheck, CalendarDays, Users } from "lucide-react";
import API from "../api/axios";

export default function CreatorCard({ creator, onFollowToggle }) {
  const [following, setFollowing] = useState(creator.isFollowing || false);
  const [loading, setLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(creator.followersCount || 0);

  const handleFollow = async () => {
    try {
      setLoading(true);
      await API.post(`/users/${creator._id}/follow`);
      const newFollowing = !following;
      setFollowing(newFollowing);
      setFollowersCount(prev => newFollowing ? prev + 1 : prev - 1);
      onFollowToggle?.(creator._id, newFollowing);
    } catch (err) {
      console.error("Failed to follow/unfollow:", err);
    } finally {
      setLoading(false);
    }
  };

  const isFeatured = (creator.followersCount || 0) > 50;
  const eventCount = creator.eventsCount || 0;

  return (
    <article className="group bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-pink-200/40">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Avatar
            src={getProfileImageUrl(creator)}
            name={creator.name || creator.username}
            className="w-14 h-14 rounded-xl flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="text-base font-bold text-gray-900 truncate">
                {creator.name || creator.username}
              </h3>
              {isFeatured && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.6rem] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-700 border border-amber-200">
                  Featured
                </span>
              )}
              {creator.verified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.6rem] font-extrabold uppercase tracking-wide bg-pink-100 text-pink-600 border border-pink-200">
                  ✓ Pro
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">@{creator.username}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-gray-500">
            <CalendarDays size={14} className="text-pink-500" />
            <span className="font-semibold text-gray-900">{eventCount}</span>
            <span>event{eventCount !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <Users size={14} className="text-pink-500" />
            <span className="font-semibold text-gray-900">{followersCount.toLocaleString()}</span>
            <span>follower{followersCount !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Points (if available) */}
        {creator.points !== undefined && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-purple-500">
                <path d="M13 2L4.09 12.96A1 1 0 005 14.5h6.5L11 22l8.91-10.96A1 1 0 0019 10H12.5L13 2z" />
              </svg>
              <span className="font-bold text-gray-900">{fmtPoints(creator.points)}</span>
              <span className="text-gray-400">pts</span>
            </div>
          </div>
        )}

        {/* Follow Button */}
        <Button
          className="w-full mt-4"
          size="sm"
          variant={following ? "secondary" : "primary"}
          onClick={handleFollow}
          disabled={loading}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          ) : following ? (
            <>
              <UserCheck size={14} />
              Following
            </>
          ) : (
            <>
              <UserPlus size={14} />
              Follow
            </>
          )}
        </Button>
      </div>
    </article>
  );
}

function fmtPoints(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n || 0);
}