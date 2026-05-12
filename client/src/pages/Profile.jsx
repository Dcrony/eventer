import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  CalendarDays,
  ChartColumn,
  Heart,
  Link2,
  MapPin,
  MessageSquare,
  UserRoundPlus,
  Sparkles,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import EventCard from "../components/EventCard";
import Button from "../components/ui/button";
import VerifiedBadge from "../components/ui/verified-badge";
import { getCoverImageUrl, getProfileImageUrl } from "../utils/eventHelpers";
import Avatar from "../components/ui/avatar";
import useShareLink from "../hooks/useShareLink";
import ShareModal from "@/components/ShareModal";

const TAB_ITEMS = [
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "likes", label: "Likes", icon: Heart },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "analytics", label: "Analytics", icon: ChartColumn, ownerOnly: true },
];

function formatJoinDate(value) {
  if (!value) return "Joined recently";
  try {
    return `Joined ${new Date(value).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}`;
  } catch {
    return "Joined recently";
  }
}

function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }) {
  const IconComponent = Icon || CalendarDays;
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-500">
        <IconComponent size={24} />
      </div>
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-400 max-w-md leading-relaxed">{subtitle}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 h-10 px-5 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/25"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function AnalyticsCard({ label, value, helper }) {
  return (
    <article className="group relative bg-white border border-gray-200 rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-pink-200/40 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <strong className="block text-3xl font-extrabold tracking-tight text-gray-900 mt-1 mb-0.5">
        {value}
      </strong>
      <small className="text-xs text-gray-400">{helper}</small>
    </article>
  );
}

export default function Profile() {
  const { id, userId, username } = useParams();
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const resolvedProfileId = username || userId || id || storedUser?._id || storedUser?.id;
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("events");
  const [followPending, setFollowPending] = useState(false);
  const [indicator, setIndicator] = useState({ width: 0, left: 0 });
  const tabsRef = useRef({});
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const isSelf = resolvedProfileId === storedUser?._id || resolvedProfileId === storedUser?.id;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(resolvedProfileId || ""));
        const path = isSelf
          ? "/users/me"
          : isObjectId
            ? `/users/${resolvedProfileId}`
            : `/users/public/${resolvedProfileId}`;

        const { data } = await API.get(path);
        setProfile(data);
      } catch (error) {
        // Failed to load profile - will show error state
      }
    };

    if (resolvedProfileId) {
      fetchProfile();
    }
  }, [resolvedProfileId, storedUser?._id, storedUser?.id]);

  const visibleTabs = useMemo(
    () => TAB_ITEMS.filter((tab) => !tab.ownerOnly || profile?.isOwner),
    [profile?.isOwner],
  );

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || "events");
    }
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    const updateIndicator = () => {
      const currentTab = tabsRef.current[activeTab];
      if (!currentTab) return;
      setIndicator({
        width: currentTab.offsetWidth,
        left: currentTab.offsetLeft,
      });
    };
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab, visibleTabs]);

  const createdEvents = profile?.createdEvents || [];
  const likedEvents = profile?.likedEvents || [];
  const savedEvents = profile?.savedEvents || [];
  const followers = profile?.stats?.followers || profile?.followers?.length || 0;
  const following = profile?.stats?.following || profile?.following?.length || 0;
  const profileName = profile?.name || profile?.username || "Profile";
  const profileHandle = profile?.username ? `@${profile.username}` : "@tickispot";
  const location = profile?.location || profile?.country || "Lagos, Nigeria";
  const analyticsSummary = [
    { label: "Events", value: profile?.stats?.events || 0, helper: "Published on TickiSpot" },
    { label: "Followers", value: followers, helper: "People tracking this profile" },
    { label: "Engagement", value: profile?.stats?.totalLikes || 0, helper: "Total likes across events" },
    { label: "Views", value: profile?.stats?.totalViews || 0, helper: "Profile event impressions" },
  ];

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "likes":
        return {
          items: likedEvents,
          empty: {
            icon: Heart,
            title: "No liked events yet",
            subtitle: profile?.isOwner
              ? "Events you like will show up here for quick access."
              : "This user has not liked any public events yet.",
            actionLabel: profile?.isOwner ? "Explore events" : null,
            onAction: profile?.isOwner ? () => navigate("/events") : null,
          },
        };
      case "saved":
        return {
          items: savedEvents,
          empty: {
            icon: Bookmark,
            title: "No saved events",
            subtitle: profile?.isOwner
              ? "Events you favorite appear here. Browse events and tap Favorite on any card."
              : "This user has no saved events to display.",
            actionLabel: profile?.isOwner ? "Discover events" : null,
            onAction: profile?.isOwner ? () => navigate("/events") : null,
          },
        };
      case "analytics":
        return { items: [] };
      default:
        return {
          items: createdEvents,
          empty: {
            icon: CalendarDays,
            title: "No events published yet",
            subtitle: profile?.isOwner
              ? "Create an event and it will appear here on your public profile."
              : "This user has not published any events yet.",
            actionLabel: profile?.isOwner ? "Open dashboard" : null,
            onAction: profile?.isOwner ? () => navigate("/dashboard") : null,
          },
        };
    }
  }, [activeTab, createdEvents, likedEvents, navigate, profile?.isOwner, savedEvents]);

  const handleFollowToggle = async () => {
    if (!profile?._id || followPending) return;
    try {
      setFollowPending(true);
      await API.post(`/users/${profile._id}/follow`);
      setProfile((current) => ({
        ...current,
        isFollowing: !current.isFollowing,
        stats: {
          ...current.stats,
          followers: Math.max(0, Number(current.stats?.followers || 0) + (current.isFollowing ? -1 : 1)),
        },
      }));
    } catch (error) {
      // Silently handle follow state update failure
    } finally {
      setFollowPending(false);
    }
  };

  const handleShareProfile = async () => {
    setShareOpen(true);
  };

  if (!profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 font-geist text-gray-400 pt-8 lg:pl-[var(--sidebar-width,0px)]">
        <div className="w-10 h-10 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
        <p className="text-sm">Loading profile...</p>
      </div>
    );
  }

  return (
    // Only apply sidebar padding on desktop screens (lg and above)
    <div className="min-h-screen bg-gray-50 font-geist pt-8 lg:pl-[var(--sidebar-width,0px)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Cover Image */}
          <div className="relative min-h-[180px] md:min-h-[220px] bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950">
            {getCoverImageUrl(profile) && (
              <img
                src={getCoverImageUrl(profile)}
                alt=""
                className="w-full h-[180px] md:h-[220px] object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>

          {/* Profile Header Body */}
          <div className="px-4 sm:px-6 pb-5 sm:pb-6">
            {/* Identity Row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="-mt-12 sm:-mt-14 flex-shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 p-1 rounded-full bg-white shadow-lg">
                  <Avatar
                    src={getProfileImageUrl(profile)}
                    name={profileName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:mt-4">
                {profile.isOwner ? (
                  <>
                    <Button variant="secondary" onClick={handleShareProfile} className="text-sm">
                      <Link2 size={16} /> Share Profile
                    </Button>
                    <Button onClick={() => navigate("/edit-profile")} className="text-sm">
                      Edit Profile
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant={profile.isFollowing ? "secondary" : "primary"}
                      onClick={handleFollowToggle}
                      disabled={followPending}
                      className="text-sm"
                    >
                      <UserRoundPlus size={16} />
                      {profile.isFollowing ? "Following" : "Follow"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/messages?user=${profile._id}`)}
                      className="text-sm"
                    >
                      <MessageSquare size={16} /> Message
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Profile Summary */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                  {profileName}
                </h1>
                <VerifiedBadge user={profile} />
              </div>
              <p className="text-sm text-gray-400">{profileHandle}</p>
              <p className="text-sm text-gray-600 max-w-lg leading-relaxed">
                {profile.bio || "Building community through memorable events and conversations."}
              </p>

              {/* Meta Row */}
              <div className="flex flex-wrap gap-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                  <MapPin size={14} className="text-pink-500" /> {location}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                  <CalendarDays size={14} className="text-pink-500" /> {formatJoinDate(profile.createdAt)}
                </span>
              </div>

              {/* Follow Stats */}
              <div className="flex gap-5">
                <button type="button" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors">
                  <strong className="text-sm font-extrabold text-gray-900">{following}</strong>
                  <span>Following</span>
                </button>
                <button type="button" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors">
                  <strong className="text-sm font-extrabold text-gray-900">{followers}</strong>
                  <span>Followers</span>
                </button>
              </div>
            </div>

            {/* Plan Badge */}
            <div className="mt-3">
              <span className={`inline-flex items-center h-6 px-2 rounded-full text-[0.6rem] font-extrabold tracking-wide ${
                profile.plan === "free"
                  ? "bg-gray-100 text-gray-600 border border-gray-200"
                  : profile.plan === "pro"
                  ? "bg-pink-50 text-pink-600 border border-pink-200"
                  : "bg-gray-900 text-white"
              }`}>
                {profile.plan?.toUpperCase()} PLAN
              </span>
              <p className="text-xs text-gray-400 mt-1">
                {profile.plan === "free" && "Upgrade to unlock more features"}
                {profile.plan === "pro" && "You have access to pro features"}
                {profile.plan === "business" && "Full access enabled"}
              </p>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
          {/* Tab Strip */}
          <div className="sticky top-4 z-10 mb-4 pb-0.5 bg-white/95 backdrop-blur-sm">
            <div className="relative flex gap-0.5 overflow-x-auto border-b border-gray-200 scrollbar-hide">
              <span
                className="absolute bottom-0 h-0.5 rounded-full bg-pink-500 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(244,63,142,0.3)]"
                style={{ width: `${indicator.width}px`, transform: `translateX(${indicator.left}px)` }}
                aria-hidden="true"
              />
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    ref={(node) => { tabsRef.current[tab.id] = node; }}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-1.5 flex-shrink-0 min-w-[90px] px-3 py-2 pb-2.5 border-none bg-transparent text-xs font-semibold cursor-pointer transition-colors duration-200 ${
                      activeTab === tab.id ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[260px]">
            {activeTab === "analytics" ? (
              <div className="space-y-4">
                {/* Analytics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {analyticsSummary.map((item) => (
                    <AnalyticsCard key={item.label} {...item} />
                  ))}
                </div>

                {/* Analytics Events */}
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-sm font-extrabold text-gray-900 mb-0.5">Top event performance</h2>
                      <p className="text-xs text-gray-400">Jump into each event to review its deeper analytics.</p>
                    </div>
                  </div>

                  {createdEvents.length ? (
                    <div className="space-y-2">
                      {createdEvents.map((event) => (
                        <article
                          key={event._id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-gray-200 rounded-xl transition-all duration-200 hover:border-pink-200 hover:bg-pink-50/30"
                        >
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-0.5">{event.title}</h3>
                            <p className="text-xs text-gray-400">
                              {event.viewCount || 0} views · {event.likeCount || 0} likes · {event.commentCount || 0} comments
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate(`/events/${event._id}/analytics`)}
                            className="h-8 px-3 rounded-full border border-gray-200 bg-white text-xs font-bold text-gray-600 transition-all duration-200 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50 whitespace-nowrap"
                          >
                            View analytics
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={ChartColumn}
                      title="No analytics to show yet"
                      subtitle="Publish your first event to unlock detailed audience and performance insights."
                      actionLabel="Create event"
                      onAction={() => navigate("/dashboard")}
                    />
                  )}
                </div>
              </div>
            ) : tabContent.items.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tabContent.items.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState {...tabContent.empty} />
            )}
          </div>
        </div>

        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          title={`${profileName} on TickiSpot`}
          url={
            profile?.username
              ? `${window.location.origin}/user/${profile.username}`
              : `${window.location.origin}/profile/${profile._id}`
          }
        />
      </div>
    </div>
  );
}