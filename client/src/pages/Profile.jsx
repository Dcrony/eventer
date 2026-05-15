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
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  BarChart3,
  Ticket,
  Eye,
  Clock,
  Radio,
  Share2Icon,
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import API from "../api/axios";
import EventCard from "../components/EventCard";
import EditEvent from "../components/EditEvent";
import TeamManagement from "../components/TeamManagement";
import Button from "../components/ui/button";
import VerifiedBadge from "../components/ui/verified-badge";
import { getCoverImageUrl, getProfileImageUrl, formatEventDate, formatEventPrice, getEventImageUrl, formatCompactNumber } from "../utils/eventHelpers";
import Avatar from "../components/ui/avatar";
import { UserAvatar } from "../components/ui/avatar";
import useShareLink from "../hooks/useShareLink";
import useFeatureAccess from "../hooks/useFeatureAccess";
import ShareModal from "@/components/ShareModal";
import EventActionMenu from "../components/EventActionMenu";
import {
  canEditEvent as canEditFeaturedEvent,
  canManageTeam as canManageFeaturedEventTeam,
} from "../utils/eventPermissions";

import FollowersModal from "../components/FollowersModal";


const TAB_ITEMS = [
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "featured", label: "Featured", icon: Sparkles },
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

// Enhanced Featured Event Card Component
function FeaturedEventCard({ 
  event, 
  onEdit, 
  onManageTeam, 
  onToggleLive, 
  onDelete, 
  onUpgradeAnalytics, 
  onUpgradeLive, 
  liveBusy 
}) {
  const imageUrl = getEventImageUrl(event);
  const organizer = event.createdBy;
  const isLive = event.liveStream?.isLive;

  const menuItems = [
    onToggleLive && {
      key: "live",
      label: isLive ? "Stop Live" : "Go Live",
      icon: Radio,
      onClick: () => onToggleLive(event),
      loading: liveBusy,
    },
    onEdit && {
      key: "edit",
      label: "Edit event",
      icon: Pencil,
      onClick: () => onEdit(event._id),
    },
    {
      key: "tickets",
      label: "Manage tickets",
      icon: Ticket,
      to: `/events/${event._id}/tickets`,
    },
    onUpgradeAnalytics
      ? {
          key: "analytics-upgrade",
          label: "Analytics (Pro)",
          icon: BarChart3,
          onClick: onUpgradeAnalytics,
        }
      : {
          key: "analytics",
          label: "Analytics",
          icon: BarChart3,
          to: `/events/${event._id}/analytics`,
        },
    onManageTeam && {
      key: "team",
      label: "Manage team",
      icon: Users,
      onClick: () => onManageTeam(event._id),
    },
    onDelete && { type: "divider" },
    onDelete && {
      key: "delete",
      label: "Delete event",
      icon: Trash2,
      danger: true,
      onClick: () => onDelete(event._id),
    },
  ].filter(Boolean);

  return (
    <article className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-pink-200/40">
      {/* Image Section */}
      <Link to={`/event/${event._id}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CalendarDays size={40} className="text-white/20" />
            </div>
          )}

          {/* Live Badge */}
          {isLive && (
            <span className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500 text-white text-[0.65rem] font-extrabold uppercase tracking-wide shadow-lg shadow-red-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          )}

          {/* Featured Badge */}
          <span className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[0.6rem] font-extrabold uppercase tracking-wide shadow-md">
            <Sparkles size={10} />
            Featured
          </span>
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-4">
        {/* Header with Title & Menu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link to={`/event/${event._id}`} className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 hover:text-pink-500 transition-colors">
              {event.title}
            </h3>
          </Link>
          <div className="flex-shrink-0">
            <EventActionMenu items={menuItems} />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {event.description || "No description provided."}
        </p>

        {/* Event Details Grid */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CalendarDays size={12} className="text-pink-500 flex-shrink-0" />
            <span>{formatEventDate(event.startDate || event.date)}</span>
            <span className="text-gray-300">•</span>
            <Clock size={12} className="text-pink-500 flex-shrink-0" />
            <span>{event.startTime || "TBD"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin size={12} className="text-pink-500 flex-shrink-0" />
            <span className="truncate">{event.location || "Online event"}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between gap-2 mb-3 p-2 rounded-lg bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Ticket size={12} className="text-pink-500" />
              <span className="text-xs font-semibold text-gray-900">{event.ticketsSold || 0}</span>
              <span className="text-[0.6rem] text-gray-400">sold</span>
            </div>
            <div className="w-px h-3 bg-gray-300" />
            <div className="flex items-center gap-1">
              <Eye size={12} className="text-blue-500" />
              <span className="text-xs font-semibold text-gray-900">{formatCompactNumber(event.viewCount || 0)}</span>
            </div>
            <div className="w-px h-3 bg-gray-300" />
            <div className="flex items-center gap-1">
              <Heart size={12} className="text-red-400" />
              <span className="text-xs font-semibold text-gray-900">{formatCompactNumber(event.likeCount || 0)}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-gray-400">Price</span>
            <p className="text-base font-extrabold text-gray-900 leading-tight">
              {formatEventPrice(event)}
            </p>
          </div>
        </div>

        {/* Organizer Info */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <UserAvatar user={organizer} className="w-6 h-6 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-gray-900 truncate">
                {organizer?.username || organizer?.name || "Deleted Organizer"}
              </span>
              <VerifiedBadge user={organizer} />
            </div>
            <p className="text-[0.6rem] text-gray-400">Organizer</p>
          </div>
        </div>

        {/* Capacity Progress Bar */}
        {event.totalTickets && (
          <div className="mt-3">
            <div className="flex justify-between text-[0.6rem] text-gray-500 mb-1">
              <span>Capacity</span>
              <span>{Math.round(((event.ticketsSold || 0) / event.totalTickets) * 100)}% filled</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((event.ticketsSold || 0) / event.totalTickets) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [liveBusyId, setLiveBusyId] = useState(null);
  const { hasAccess: canAccessAnalytics, promptUpgrade: promptUpgradeAnalytics } = useFeatureAccess("analytics");
  const { hasAccess: canAccessLiveStreaming, promptUpgrade: promptUpgradeLive } = useFeatureAccess("live_stream");

const [followersModalOpen, setFollowersModalOpen] = useState(false);
const [followersModalTab, setFollowersModalTab] = useState("followers");


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
  const featuredEvents = profile?.featuredEvents || [];
  const likedEvents = profile?.likedEvents || [];
  const savedEvents = profile?.savedEvents || [];
  const followers = profile?.stats?.followers || profile?.followers?.length || 0;
  const following = profile?.stats?.following || profile?.following?.length || 0;
  const totalEventsCreated = profile?.stats?.totalEventsCreated ?? createdEvents.length;
  const totalTicketsSold = profile?.stats?.totalTicketsSold ?? createdEvents.reduce(
    (sum, event) => sum + Number(event?.ticketsSold || 0),
    0,
  );
  const totalFeaturedEvents = profile?.stats?.totalFeaturedEvents ?? featuredEvents.length;
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
      // In Profile.jsx tabContent for "featured":
case "featured":
  return {
    items: featuredEvents,
    empty: {
      icon: Sparkles,
      title: "No team events yet",
      subtitle: profile?.isOwner
        ? "Events you've been invited to collaborate on will appear here."
        : "This user hasn't joined any events as a collaborator yet.",
      actionLabel: null,
      onAction: null,
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
  }, [activeTab, createdEvents, featuredEvents, likedEvents, navigate, profile?.isOwner, savedEvents]);

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

  const handleFeaturedEventUpdated = async () => {
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
    } catch {
      // Refresh failure is non-fatal.
    }
  };

  const openEditModal = (eventId) => {
    setSelectedEventId(eventId);
    setEditModalOpen(true);
  };

  const openTeamModal = (eventId) => {
    setSelectedEventId(eventId);
    setTeamModalOpen(true);
  };

  const handleToggleLive = async (event) => {
    if (!canAccessLiveStreaming) {
      promptUpgradeLive();
      return;
    }

    setLiveBusyId(event._id);
    try {
      await API.patch("/events/toggle-live", {
        eventId: event._id,
        isLive: !event.liveStream?.isLive,
      });
      await handleFeaturedEventUpdated();
      if (!event.liveStream?.isLive) {
        navigate(`/live/${event._id}`);
      }
    } catch {
      // API interceptor and page refresh cover most failure cases.
    } finally {
      setLiveBusyId(null);
    }
  };

  const handleDeleteFeaturedEvent = async (eventId) => {
    const eventToDelete = featuredEvents.find((event) => event._id === eventId);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${eventToDelete?.title}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await API.delete(`/events/delete/${eventId}`);
      await handleFeaturedEventUpdated();
    } catch {
      // Let the shared interceptor and refetch path handle the visible failure state.
    }
  };

  // AFTER — replace with:
if (!profile) {
  return (
    <div className="min-h-screen bg-gray-50 font-geist pt-2 lg:pl-[var(--sidebar-width,0px)]">
      <div className="max-w-6xl mx-auto space-y-5 animate-pulse">

        {/* Cover + avatar skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-[180px] md:h-[220px] bg-gray-100" />
          <div className="px-4 sm:px-6 pb-5 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="-mt-12 sm:-mt-14">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-200 border-4 border-white" />
              </div>
              <div className="flex gap-2 sm:mt-4">
                <div className="h-9 w-28 rounded-full bg-gray-100" />
                <div className="h-9 w-28 rounded-full bg-gray-100" />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="h-7 w-48 bg-gray-200 rounded-lg" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-4 w-72 bg-gray-100 rounded" />
              <div className="h-4 w-56 bg-gray-100 rounded" />
              <div className="flex gap-5 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 w-20 bg-gray-100 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tab + content skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <div className="flex gap-4 border-b border-gray-100 pb-3 mb-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-5 w-16 bg-gray-100 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gray-50 font-geist pt-2 lg:pl-[var(--sidebar-width,0px)]">
      <div className="max-w-6xl mx-auto  space-y-5">
        {/* Profile Header Card */}
        <div className="bg-transparent overflow-hidden">
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
                      <Share2Icon size={16} />
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
                      <MessageSquare size={16} />
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
              <div className="flex flex-wrap gap-2">
                // Replace the static Following/Followers spans with:
<button type="button" onClick={() => { setFollowersModalTab("following"); setFollowersModalOpen(true); }}
  className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors">
  <strong className="text-sm font-extrabold text-gray-900">{following}</strong>
  <span>Following</span>
</button>
<button type="button" onClick={() => { setFollowersModalTab("followers"); setFollowersModalOpen(true); }}
  className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors">
  <strong className="text-sm font-extrabold text-gray-900">{followers}</strong>
  <span>Followers</span>
</button>
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                  <strong className="text-sm font-extrabold text-gray-900">{totalEventsCreated}</strong>
                  <span>Events created</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                  <strong className="text-sm font-extrabold text-gray-900">{totalTicketsSold}</strong>
                  <span>Tickets sold</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                  <strong className="text-sm font-extrabold text-gray-900">{totalFeaturedEvents}</strong>
                  <span>Featured events</span>
                </span>
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
        <div className="bg-transparent p-4 sm:p-5">
          {/* Tab Strip */}
          <div className="sticky top-1 z-10 mb-4 pb-0.5 bg-transparent backdrop-blur-sm">
            <div className="relative flex gap-0.5 overflow-x-auto border-b border-gray-200 scrollbar-hide scrollbar-thin scrollbar-thumb-gray-300">
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
            ) : activeTab === "featured" && tabContent.items.length ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-extrabold text-gray-900 mb-0.5">Featured event workspace</h2>
                  <p className="text-xs text-gray-400">
                    Created events and collaborator events live here, with access controls based on role.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {tabContent.items.map((event) => (
                    <FeaturedEventCard
                      key={event._id}
                      event={event}
                      onEdit={canEditFeaturedEvent(event) ? openEditModal : null}
                      onManageTeam={canManageFeaturedEventTeam(event) ? openTeamModal : null}
                      onToggleLive={handleToggleLive}
                      onDelete={event?.eventAccess?.isOwner ? handleDeleteFeaturedEvent : null}
                      onUpgradeAnalytics={canAccessAnalytics ? null : promptUpgradeAnalytics}
                      onUpgradeLive={canAccessLiveStreaming ? null : promptUpgradeLive}
                      liveBusy={liveBusyId === event._id}
                    />
                  ))}
                </div>
              </div>
            ) : tabContent.items.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

<FollowersModal
  open={followersModalOpen}
  onClose={() => setFollowersModalOpen(false)}
  profileId={profile?._id}
  initialTab={followersModalTab}
/>
        <EditEvent
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedEventId(null);
          }}
          eventId={selectedEventId}
          onEventUpdated={handleFeaturedEventUpdated}
        />
        <TeamManagement
          eventId={selectedEventId}
          isOpen={teamModalOpen}
          onClose={() => {
            setTeamModalOpen(false);
            setSelectedEventId(null);
          }}
        />
      </div>
    </div>
  );
}