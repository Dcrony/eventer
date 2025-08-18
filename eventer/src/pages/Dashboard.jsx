import { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import "./CSS/home.css";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Fetch organizer events
    Promise.all([
      API.get("/events/my-events"),
      API.get("/stats/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
    ])
      .then(([eventsRes, statsRes]) => {
        setEvents(eventsRes.data);
        setStats(statsRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard Error:", err);
        setError("Failed to load dashboard data. Please try again.");
        setLoading(false);
      });
  }, [token]);

  const toggleLive = async (id, currentStatus) => {
    try {
      await API.patch("/events/toggle-live", {
        eventId: id,
        isLive: !currentStatus,
      });
      setEvents(
        events.map((ev) =>
          ev._id === id
            ? {
                ...ev,
                liveStream: { ...ev.liveStream, isLive: !currentStatus },
              }
            : ev
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to toggle live status");
    }
  };

  const navigate = useNavigate();

  const handleDelete = async (id) => {
    const eventToDelete = events.find(e => e._id === id);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${eventToDelete?.title}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      await API.delete(`/events/delete/${id}`);
      setEvents(events.filter((e) => e._id !== id));
      alert("Event deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete event. Please try again.");
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
  };

  return (
    <div className="home">
      <h2>🎛 Organizer Dashboard</h2>
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '24px' }}>⏳</div>
          <p>Loading dashboard...</p>
        </div>
      )}
      
      {error && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
          <p>❌ {error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      )}
      
      {!loading && !error && stats && (
        <div className="card p-3 mb-4">
          <h4 className="mb-3">📊 Stats Overview</h4>
          <p>Total Events: {stats.totalEvents}</p>
          <p>Total Tickets Sold: {stats.totalTickets}</p>
          <p>Total Revenue: ₦{stats.totalRevenue}</p>

          <h3>🏆 Top Events</h3>
          {stats.topEvents?.length > 0 ? (
            <ul>
              {stats.topEvents.map((event, i) => (
                <li key={i}>
                  {event.title} — {event.quantitySold} tickets
                </li>
              ))}
            </ul>
          ) : (
            <p>No events yet.</p>
          )}
        </div>
      )}
      <h4 className="mb-3">Your Events</h4>
      {events.length === 0 ? (
        <p>You haven’t created any events yet.</p>
      ) : (
        events.map((event) => (
          <div
            key={event._id}
            style={{
              border: "1px solid #ccc",
              margin: "10px",
              padding: "10px",
            }}
          >
            <h3>{event.title}</h3>
            <img
              src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${event.image}`}
              alt={`${event.title} poster`}
              style={{
                width: "100%",
                maxHeight: "300px",
                objectFit: "cover",
                marginBottom: "10px",
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <p>
              {event.date} @ {event.location}
            </p>
            <p>Tickets left: {event.totalTickets}</p>
            <button
              onClick={() => toggleLive(event._id, event.liveStream?.isLive)}
            >
              {event.liveStream?.isLive ? "🔴 Stop Live" : "🟢 Go Live"}
            </button>
            <button onClick={() => handleEdit(event._id)}>✏️ Edit</button>
            <button onClick={() => handleDelete(event._id)}>🗑 Delete</button>
          </div>
        ))
      )}
    </div>
  );
}
