import { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import "./CSS/home.css";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Fetch organizer events
    API.get("/events/my-events")
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err));

    // Fetch stats
    API.get("/events/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => setStats(res.data))
      .catch((err) => {
        console.error("Stats Error:", err);
      });
  }, []);

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
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await API.delete(`/events/delete/${id}`);
      setEvents(events.filter((e) => e._id !== id));
      alert("Event deleted");
    } catch (err) {
      console.error(err);
      alert("Failed to delete event");
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
  };

  return (
    <div className="home">
      <h2>🎛 Organizer Dashboard</h2>
      {stats && (
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
              src={`http://localhost:5000/uploads/${event.image}`}
              alt={`${event.title} poster`}
              style={{
                width: "100%",
                maxHeight: "300px",
                objectFit: "cover",
                marginBottom: "10px",
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
