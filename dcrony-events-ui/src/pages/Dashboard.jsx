import { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";



export default function Dashboard() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    API.get("/events/my-events")
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err));
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
    <div>
      <h2>🎛 Organizer Dashboard</h2>
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
