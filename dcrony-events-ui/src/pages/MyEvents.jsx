import { useEffect, useState } from "react";
import API from "../api/axios";

export default function MyEvents() {
  const [events, setEvents] = useState([]);
  const [buyersMap, setBuyersMap] = useState({});
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get("/events/my-events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data);
    } catch (err) {
      alert("Error fetching events");
    }
  };

  const fetchBuyers = async (eventId) => {
    try {
      const res = await API.get(`/events/buyers/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBuyersMap((prev) => ({ ...prev, [eventId]: res.data }));
    } catch (err) {
      alert("Failed to fetch buyers");
    }
  };

  const toggleLive = async (eventId) => {
    try {
      await API.patch(
        "/events/toggle-live",
        { eventId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchEvents();
    } catch (err) {
      alert("Failed to update stream status");
    }
  };

  const handleDelete = async (eventId) => {
  if (!window.confirm("Are you sure you want to delete this event?")) return;

  try {
    await API.delete(`/events/delete/${eventId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert("Event deleted");
    fetchEvents();
  } catch (err) {
    alert("Failed to delete event");
  }
};

const handleEdit = (event) => {
  const newTitle = prompt("New event title:", event.title);
  if (!newTitle) return;

  try {
    API.put(
      `/events/update/${event._id}`,
      { title: newTitle },
      { headers: { Authorization: `Bearer ${token}` } }
    ).then(() => {
      alert("Event updated");
      fetchEvents();
    });
  } catch (err) {
    alert("Failed to update event");
  }
};


  return (
    <div>
      <h2>My Events</h2>
      {events.map((event) => (
        <div
          key={event._id}
          style={{ border: "1px solid #ccc", padding: 10, margin: 10 }}
        >
          <h3>{event.title}</h3>
          <p>
            {event.date} at {event.time} — {event.location}
          </p>
          <p>
            Price: ₦{event.ticketPrice} | Left: {event.totalTickets}
          </p>
          <p>Live: {event.liveStream?.isLive ? "🟢 Live" : "⚪ Offline"}</p>
          <LiveChat eventId={event._id} username="Dcrony" />


          <button onClick={() => toggleLive(event._id)}>
            {event.liveStream?.isLive ? "Stop Stream" : "Go Live"}
          </button>

          <div style={{ marginTop: 10 }}>
            <button onClick={() => fetchBuyers(event._id)}>View Buyers</button>
            <div style={{ marginTop: "10px" }}>
              <button onClick={() => handleEdit(event)}>Edit</button>
              <button
                onClick={() => handleDelete(event._id)}
                style={{ marginLeft: "10px", color: "red" }}
              >
                Delete
              </button>
            </div>

            {buyersMap[event._id] && (
              <ul style={{ marginTop: 10 }}>
                {buyersMap[event._id].map((ticket) => (
                  <li key={ticket._id}>
                    {ticket.user?.username} ({ticket.user?.email}) —{" "}
                    {ticket.quantity} ticket(s)
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
