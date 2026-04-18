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
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import EventCard from "../components/EventCard";
import Button from "../components/ui/button";
import VerifiedBadge from "../components/ui/verified-badge";
import { getCoverImageUrl, getProfileImageUrl } from "../utils/eventHelpers";
import useShareLink from "../hooks/useShareLink";
import "./CSS/Profile.css";

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
    <div className="profile-empty-state">
      <div className="profile-empty-icon">
        <IconComponent size={24} />
      </div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
      {actionLabel && onAction ? (
        <button type="button" className="profile-empty-action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function AnalyticsCard({ label, value, helper }) {
  return (
    <article className="profile-analytics-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
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
  const shareLink = useShareLink();

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
        console.error("Failed to load profile:", error);
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
          followers: Math.max(
            0,
            Number(current.stats?.followers || 0) + (current.isFollowing ? -1 : 1),
          ),
        },
      }));
    } catch (error) {
      console.error("Failed to update follow state:", error);
    } finally {
      setFollowPending(false);
    }
  };

  const handleShareProfile = async () => {
    const profileUrl = profile?.username
      ? `${window.location.origin}/user/${profile.username}`
      : `${window.location.origin}/profile/${profile?._id}`;

    await shareLink({
      title: `${profileName} on TickiSpot`,
      text: `Check out ${profileName}'s profile on TickiSpot`,
      url: profileUrl,
      copiedMessage: "Profile link copied",
    });
  };

  if (!profile) {
    return (
      <div className="profile-shell profile-loading-state">
        <div className="profile-spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page profile-shell">
      <div className="dashboard-container profile-layout">
        <section className="profile-header-card">
          <div className="profile-cover-frame">
            {getCoverImageUrl(profile) ? <img src={getCoverImageUrl(profile)} alt="" /> : null}
            <div className="profile-cover-gradient" />
          </div>

          <div className="profile-header-body">
            <div className="profile-identity-row">
              <div className="profile-avatar-column">
                <div className="profile-avatar">
                  <img
                    src={getProfileImageUrl(profile) || "/default-avatar.png"}
                    alt={profileName}
                  />
                </div>
              </div>

              <div className="profile-header-actions">
                {profile.isOwner ? (
                  <>
                    <Button variant="secondary" onClick={handleShareProfile}>
                      <Link2 size={16} />
                      Share Profile
                    </Button>
                    <Button onClick={() => navigate("/edit-profile")}>Edit Profile</Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant={profile.isFollowing ? "secondary" : "primary"}
                      onClick={handleFollowToggle}
                      disabled={followPending}
                    >
                      <UserRoundPlus size={16} />
                      {profile.isFollowing ? "Following" : "Follow"}
                    </Button>
                    <Button variant="secondary" onClick={() => navigate(`/messages?user=${profile._id}`)}>
                      <MessageSquare size={16} />
                      Message
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="profile-summary">
              <div className="profile-name-line">
                <h1>{profileName}</h1>
                <VerifiedBadge user={profile} />
              </div>
              <p className="profile-handle">{profileHandle}</p>
              <p className="profile-bio-text">
                {profile.bio || "Building community through memorable events and conversations."}
              </p>

              <div className="profile-meta-row">
                <span>
                  <MapPin size={16} />
                  {location}
                </span>
                <span>
                  <CalendarDays size={16} />
                  {formatJoinDate(profile.createdAt)}
                </span>
              </div>

              <div className="profile-follow-row">
                <button type="button" className="profile-follow-stat">
                  <strong>{following}</strong>
                  <span>Following</span>
                </button>
                <button type="button" className="profile-follow-stat">
                  <strong>{followers}</strong>
                  <span>Followers</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="profile-content-card">
          <div className="profile-tab-strip" role="tablist" aria-label="Profile sections">
            <div className="profile-tab-scroll">
              <span
                className="profile-tab-indicator"
                style={{ width: `${indicator.width}px`, transform: `translateX(${indicator.left}px)` }}
                aria-hidden="true"
              />
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    ref={(node) => {
                      tabsRef.current[tab.id] = node;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={`profile-tab-button ${activeTab === tab.id ? "is-active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="profile-tab-content">
            {activeTab === "analytics" ? (
              <div className="profile-analytics-panel">
                <div className="profile-analytics-grid">
                  {analyticsSummary.map((item) => (
                    <AnalyticsCard key={item.label} {...item} />
                  ))}
                </div>

                <div className="profile-analytics-events">
                  <div className="profile-section-heading">
                    <div>
                      <h2>Top event performance</h2>
                      <p>Jump into each event to review its deeper analytics.</p>
                    </div>
                  </div>

                  {createdEvents.length ? (
                    <div className="profile-analytics-event-list">
                      {createdEvents.map((event) => (
                        <article key={event._id} className="profile-analytics-event">
                          <div>
                            <h3>{event.title}</h3>
                            <p>
                              {event.viewCount || 0} views . {event.likeCount || 0} likes .{" "}
                              {event.commentCount || 0} comments
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate(`/events/${event._id}/analytics`)}
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
              <div className="profile-event-grid">
                {tabContent.items.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState {...tabContent.empty} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
