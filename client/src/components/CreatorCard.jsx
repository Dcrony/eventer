import { useState } from "react";
import Avatar from "./ui/avatar";
import { getProfileImageUrl } from "../utils/eventHelpers";
import Badge from "./ui/badge";
import Button from "./ui/button";
import { UserPlus, UserCheck, CalendarDays, Users } from "lucide-react";
import API from "../api/axios";
import OrganizerBadges from "./ui/organizer-badges";

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
      setFollowersCount((prev) => (newFollowing ? prev + 1 : prev - 1));
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
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white hover:-translate-y-1 hover:shadow-xl hover:border-pink-200/40">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <Avatar
            src={getProfileImageUrl(creator)}
            name={creator.name || creator.username}
            className="h-14 w-14 flex-shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold text-gray-900">
                {creator.name || creator.username}
              </h3>
              {isFeatured && (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wide text-amber-700">
                  Featured
                </span>
              )}
              <OrganizerBadges user={creator} layout="horizontal" />
            </div>
            <p className="mt-0.5 text-xs text-gray-400">@{creator.username}</p>
          </div>
        </div>

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

        <Button
          className="mt-4 w-full"
          size="sm"
          variant={following ? "secondary" : "primary"}
          onClick={handleFollow}
          disabled={loading}
        >
          {loading ? (
            <div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
