import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Edit3, LayoutDashboard, MessageSquare, Share2, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import EventCard from "../components/EventCard";
import Button from "../components/ui/button";
import VerifiedBadge from "../components/ui/verified-badge";
import useShareLink from "../hooks/useShareLink";
import { getCoverImageUrl, getProfileImageUrl, getProfileUrl } from "../utils/eventHelpers";
import "./CSS/Profile.css";

const PROFILE_TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "created", label: "Created" },
  { id: "past", label: "Past" },
];

function EmptyState({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="profile-empty">
      <div className="profile-empty-icon">
        <CalendarDays size={40} strokeWidth={1.5} />
      </div>
      <h3 className="profile-empty-title">{title}</h3>
      <p className="profile-empty-subtitle">{subtitle}</p>
      {actionLabel && onAction ? (
        <button type="button" className="profile-empty-btn" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default function Profile() {
  const { id, userId } = useParams();
  const navigate = useNavigate();
  const shareLink = useShareLink();
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const resolvedProfileId = userId || id || storedUser?._id || storedUser?.id;
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const path =
          resolvedProfileId === storedUser?._id || resolvedProfileId === storedUser?.id
            ? "/users/me"
            : `/users/${resolvedProfileId}`;

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

  const createdEvents = profile?.createdEvents || [];
  const upcomingTickets = useMemo(
    () =>
      (profile?.tickets || [])
        .filter((ticket) => ticket?.event)
        .map((ticket) => ticket.event),
    [profile?.tickets],
  );

  const shareProfile = async () => {
    if (!profile?._id) return;
    await shareLink({
      title: `${profile.name || profile.username} on TickiSpot`,
      text: `View ${profile.name || profile.username}'s events and profile on TickiSpot`,
      url: getProfileUrl(profile._id),
      copiedMessage: "Profile link copied to clipboard",
    });
  };

  if (!profile) {
    return (
      <div className="profile-loading">
        <div className="profile-loading-spinner" />
        <p className="profile-loading-text">Loading profile...</p>
      </div>
    );
  }

  const isOwner = profile.isOwner;

  return (
    <div className="dashboard-page profile-page">
      <div className="dashboard-container">
        <div className="profile-hero">
          <div className="profile-cover">
            {getCoverImageUrl(profile) ? <img src={getCoverImageUrl(profile)} alt="" /> : null}
            <div className="profile-cover-overlay" />
          </div>
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-ring">
              <img
                src={getProfileImageUrl(profile) || "/default-avatar.png"}
                alt={profile.name || profile.username}
              />
            </div>
          </div>
        </div>

        <div className="profile-card">
          <header className="profile-header">
            <div className="profile-info">
              <div className="profile-name-row">
                <h1 className="profile-name">{profile.name || profile.username}</h1>
                <VerifiedBadge user={profile} />
              </div>
              <p className="profile-username">@{profile.username}</p>
              {profile.bio ? <p className="profile-bio">{profile.bio}</p> : null}

              <div className="profile-stats-grid">
                <div>
                  <strong>{profile.stats?.followers || 0}</strong>
                  <span>Followers</span>
                </div>
                <div>
                  <strong>{profile.stats?.events || 0}</strong>
                  <span>Events</span>
                </div>
                <div>
                  <strong>{profile.stats?.totalViews || 0}</strong>
                  <span>Views</span>
                </div>
                <div>
                  <strong>{profile.stats?.totalLikes || 0}</strong>
                  <span>Likes</span>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <Button variant="secondary" onClick={shareProfile}>
                <Share2 size={16} />
                Share profile
              </Button>

              {isOwner ? (
                <>
                  <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Button>
                  <Button onClick={() => navigate("/edit-profile")}>
                    <Edit3 size={16} />
                    Edit profile
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={async () => {
                      const { data } = await API.post(`/users/${profile._id}/follow`);
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
                      return data;
                    }}
                  >
                    <Sparkles size={16} />
                    {profile.isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                  <Button variant="secondary" onClick={() => navigate(`/messages?user=${profile._id}`)}>
                    <MessageSquare size={16} />
                    Message
                  </Button>
                </>
              )}
            </div>
          </header>

          <nav className="profile-tabs" role="tablist">
            {PROFILE_TABS.filter((tab) => (tab.id === "created" ? createdEvents.length || isOwner : true)).map(
              (tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`profile-tab ${activeTab === tab.id ? "is-active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ),
            )}
          </nav>

          <div className="profile-events">
            {activeTab === "upcoming" ? (
              upcomingTickets.length ? (
                <div className="profile-event-grid modern">
                  {upcomingTickets.map((ticketEvent) => (
                    <EventCard key={ticketEvent._id} event={ticketEvent} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No upcoming events yet"
                  subtitle="Events you RSVP to or buy tickets for will show up here."
                  actionLabel="Browse events"
                  onAction={() => navigate("/events")}
                />
              )
            ) : null}

            {activeTab === "created" ? (
              createdEvents.length ? (
                <div className="profile-event-grid modern">
                  {createdEvents.map((createdEvent) => (
                    <EventCard key={createdEvent._id} event={createdEvent} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No created events yet"
                  subtitle="Create an event and it will appear here with its engagement stats."
                  actionLabel="Open dashboard"
                  onAction={() => navigate("/dashboard")}
                />
              )
            ) : null}

            {activeTab === "past" ? (
              <EmptyState
                title="No past events yet"
                subtitle="Past attendance history will appear here once events wrap up."
                actionLabel="Explore events"
                onAction={() => navigate("/events")}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
