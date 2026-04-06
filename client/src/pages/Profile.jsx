import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import { PORT_URL } from "../utils/config";
import { useParams, useNavigate } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContexts";
import { MapPin, Calendar, Ticket, ChevronRight, Edit3, LayoutDashboard } from "lucide-react";
import "./CSS/Profile.css";


export default function Profile() {
  const { id, userId } = useParams();
  const profileId = userId || id;
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");



const handleMessageClick = () => {
  navigate(`/messages?user=${profile._id}`);
};

  useEffect(() => {
    const path = profileId === "me" ? "/users/me" : `/users/${profileId}`;

    API.get(path)
      .then((res) => setProfile(res.data))
      .catch((err) => alert(err.response?.data?.message || "Failed to load profile"));
  }, [profileId]);

  if (!profile) {
    return (
      <div className={`profile-loading ${darkMode ? "dark-mode" : ""}`}>
        <div className="profile-loading-spinner" />
        <p className="profile-loading-text">Loading your profile…</p>
      </div>
    );
  }

  const isOwner = profile.isOwner;

  const roleLabel =
    profile.role === "admin"
      ? "Admin"
      : profile.role === "organizer"
        ? "Organizer"
        : "Member";


  return (
    <div className={`dashboard-page profile-page ${darkMode ? "dark-mode" : ""}`}>
      <div className="dashboard-container">
        {/* Cover + Avatar */}
        <div className="profile-hero">
          <div className="profile-cover">
            <img
              src={
                profile.coverPic
                  ? `${PORT_URL}/uploads/cover_pic/${profile.coverPic}`
                  : "/cover.jpg"
              }
              alt=""
            />
            <div className="profile-cover-overlay" />
          </div>
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-ring">
              <img
                src={
                  profile.profilePic
                    ? `${PORT_URL}/uploads/profile_pic/${profile.profilePic}`
                    : "/default-avatar.png"
                }
                alt={profile.name}
              />
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="profile-card">
          <header className="profile-header">
            <div className="profile-info">
              <div className="profile-name-row">
                <h1 className="profile-name">{profile.name}</h1>
                <span className={`profile-role-badge role-${profile.role}`}>
                  {roleLabel}
                </span>
              </div>
              <p className="profile-username">@{profile.username}</p>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            </div>
            <div className="profile-stats">
  <span>{profile.stats.followers} Followers</span>
  <span>{profile.stats.following} Following</span>
  <span>{profile.stats.events} Events</span>
</div>
            <div className="profile-actions">

  {isOwner ? (
    <>
      <button
        className="profile-btn profile-btn-primary"
        onClick={() => navigate("/dashboard")}
      >
        <LayoutDashboard size={18} />
        Dashboard
      </button>

      <button
        className="profile-btn profile-btn-secondary"
        onClick={() => navigate("/edit-profile")}
      >
        <Edit3 size={18} />
        Edit Profile
      </button>
    </>
  ) : (
    <>
      <button
        className="profile-btn profile-btn-primary"
        onClick={async () => {
          await API.post(`/users/${profile._id}/follow`);
          setProfile((prev) => ({
            ...prev,
            isFollowing: !prev.isFollowing,
          }));
        }}
      >
        {profile.isFollowing ? "Unfollow" : "Follow"}
      </button>

      <button
        className="profile-btn profile-btn-secondary"
        onClick={() => handleMessageClick() }
      >
        Message
      </button>
    </>
  )}

</div>
          </header>

          {/* Tabs */}
          <nav className="profile-tabs" role="tablist">
            {["upcoming", "past"].map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={`profile-tab ${activeTab === tab ? "is-active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "upcoming" ? "Upcoming" : "Past"}
              </button>
            ))}
            {(profile.role === "organizer" || profile.role === "admin") && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "created"}
                className={`profile-tab ${activeTab === "created" ? "is-active" : ""}`}
                onClick={() => setActiveTab("created")}
              >
                Created
              </button>
            )}
          </nav>

          {/* Events */}
          <div className="profile-events">
            {activeTab === "upcoming" &&
              (profile.tickets?.length ? (
                <div className="profile-event-grid">
                  {profile.tickets.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      onView={() => navigate(`/Eventdetail/${event._id}`)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No upcoming events"
                  subtitle="Events you’ve registered for will appear here."
                  actionLabel="Discover events"
                  onAction={() => navigate("/events")}
                />
              ))}

            {activeTab === "created" &&
              (profile.createdEvents?.length ? (
                <div className="profile-event-grid">
                  {profile.createdEvents.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      manage
                      onView={() => navigate(`/Eventdetail/${event._id}`)}
                      onManage={() => navigate("/dashboard")}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No created events"
                  subtitle="Events you create will show up here."
                  actionLabel="Create event"
                  onAction={() => navigate("/dashboard")}
                />
              ))}

            {activeTab === "past" && (
              <EmptyState
                title="No past events"
                subtitle="Your past events will appear here."
                actionLabel="Browse events"
                onAction={() => navigate("/events")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, manage, onView, onManage }) {
  const handlePrimary = () => (manage ? onManage?.() : onView?.());
  return (
    <article className="profile-event-card">
      <div className="profile-event-card-image">
        {event.image ? (
          <img
            src={`${PORT_URL}/uploads/event_image/${event.image}`}
            alt=""
            loading="lazy"
          />
        ) : (
          <div className="profile-event-card-placeholder" />
        )}
      </div>
      <div className="profile-event-card-body">
        <h3 className="profile-event-card-title">{event.title}</h3>
        {event.description && (
          <p className="profile-event-card-desc">{event.description}</p>
        )}
        <div className="profile-event-card-meta">
          {event.location && (
            <span>
              <MapPin size={14} />
              {event.location}
            </span>
          )}
          <span>
            <Ticket size={14} />
            ₦{event.ticketPrice ?? "0"}
          </span>
        </div>
        <button
          type="button"
          className={`profile-event-card-btn ${manage ? "is-outline" : ""}`}
          onClick={handlePrimary}
        >
          {manage ? "Manage Event" : "View Details"}
          <ChevronRight size={16} />
        </button>
      </div>
    </article>
  );
}

function EmptyState({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="profile-empty">
      <div className="profile-empty-icon">
        <Calendar size={40} strokeWidth={1.5} />
      </div>
      <h3 className="profile-empty-title">{title}</h3>
      <p className="profile-empty-subtitle">{subtitle}</p>
      {actionLabel && onAction && (
        <button type="button" className="profile-empty-btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
