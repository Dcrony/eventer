import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import { useParams, useNavigate } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContexts";
import "./CSS/Profile.css";

const PORT_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    API.get(`/profile/${id}`)
      .then((res) => setProfile(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  if (!profile) {
    return (
      <div className="profile-loading center">
        <div className="spinner" />
        <p>Loading your TickiSpot profile…</p>
      </div>
    );
  }

  return (
    <div className={`dashboard-page ${darkMode ? "dark-mode" : ""}`}>
      <div className="dashboard-container">
        {/* Cover */}
        <div className="profile-cover">
          <img
            src={
              profile.coverPic
                ? `${PORT_URL}/uploads/cover_pic/${profile.coverPic}`
                : "/cover.jpg"
            }
            alt="cover"
          />
          <div className="profile-avatar-wrapper">
            <img
              src={
                profile.profilePic
                  ? `${PORT_URL}/uploads/profile_pic/${profile.profilePic}`
                  : "/default-avatar.png"
              }
              alt="profile"
            />
          </div>
        </div>

        {/* Info */}
        <div className="profile-content">
          <div className="profile-header">
            <div>
              <h1>{profile.name}</h1>
              <p className="username">@{profile.username}</p>
              {profile.bio && <p className="bio">{profile.bio}</p>}
            </div>
            <div className="profile-actions">
              <button className="btn-primary" onClick={() => navigate("/dashboard")}>
                Dashboard
              </button>
              <button className="btn-outline" onClick={() => navigate("/edit-profile")}>
                Edit Profile
              </button>
            </div>
          </div>

          <hr className="divider" />

          {/* Tabs */}
          <div className="tab-container">
            {["upcoming", "past"].map((tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}

            {(profile.role === "organizer" || profile.role === "admin") && (
              <button
                className={`tab-btn ${activeTab === "created" ? "active" : ""}`}
                onClick={() => setActiveTab("created")}
              >
                Created
              </button>
            )}
          </div>

          {/* Events Grid */}
          <div className="event-grid">
            {activeTab === "upcoming" &&
              (profile.tickets?.length ? (
                profile.tickets.map((event) => <EventCard key={event._id} event={event} />)
              ) : (
                <EmptyState text="No upcoming events" />
              ))}

            {activeTab === "created" &&
              (profile.createdEvents?.length ? (
                profile.createdEvents.map((event) => <EventCard key={event._id} event={event} manage />)
              ) : (
                <EmptyState text="No created events" />
              ))}

            {activeTab === "past" && <EmptyState text="No past events" />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Helpers */
const EventCard = ({ event, manage }) => (
  <div className="event-card">
    {event.image && (
      <img src={`${PORT_URL}/uploads/event_image/${event.image}`} alt={event.title} />
    )}
    <div className="event-body">
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <div className="meta">📍 {event.location}</div>
      <div className="meta">🎟 ₦{event.ticketPrice || "0"}</div>
      <button className={manage ? "btn-outline" : "btn-primary"}>
        {manage ? "Manage Event" : "View Details"}
      </button>
    </div>
  </div>
);

const EmptyState = ({ text }) => <div className="empty-state">{text}</div>;
