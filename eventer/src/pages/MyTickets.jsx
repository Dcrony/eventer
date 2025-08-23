import { useEffect, useState } from "react";
import API from "../api/axios";
import LiveChat from "../components/LiveChats"; // optional for live events
import "./CSS/home.css";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [activeEventId, setActiveEventId] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    API.get("/tickets/my-tickets")
      .then((res) => setTickets(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleJoinChat = (eventId) => {
    setActiveEventId(eventId);
    setShowChat(true);
  };

  return (
    <div className="home">
      <h2>🎟️ My Tickets</h2>
      {tickets.length === 0 ? (
        <p>You haven't purchased any tickets yet.</p>
      ) : (
        tickets.map((ticket) => {
          const event = ticket.event;
          return (
            <div
              key={ticket._id}
              style={{
                border: "1px solid #ddd",
                margin: "10px",
                padding: "10px",
              }}
            >
              <div className="topp">
                {event.CreatedBy?.profilePic && (
                  <img
                    src={`/uploads/${event.createdBy.profilePic}`}
                    alt={event.createdBy?.username || "Creator"}
                    style={{ width: 40, height: 40, borderRadius: "50%" }}
                  />
                )}
                <h3>{event.title}</h3>
              </div>

              {event.image && (
                <img
                  src={`${
                    import.meta.env.VITE_API_URL?.replace("/api", "") ||
                    "http://localhost:5000"
                  }/uploads/event_image/${event.image}`}
                  alt={event.title}
                  style={{
                    width: "100%",
                    maxHeight: "300px",
                    objectFit: "cover",
                    marginBottom: "10px",
                  }}
                />
              )}

              <p>Quantity: {ticket.quantity}</p>
              <p>
                Date: {event.date} • Location: {event.location}
              </p>
              <p>Price Paid: ₦{event.ticketPrice * ticket.quantity}</p>

              {event.liveStream?.isLive && (
                <div style={{ marginTop: "10px" }}>
                  <strong style={{ color: "red" }}>🔴 LIVE NOW</strong>
                  <button onClick={() => handleJoinChat(event._id)}>
                    Join Live Chat
                  </button>

                  {showChat && activeEventId === event._id && (
                    <LiveChat
                      eventId={event._id}
                      username={user?.username || "Guest"}
                    />
                  )}
                </div>
              )}

              {ticket.qrCode && (
                <img
                  src={`${
                    import.meta.env.VITE_API_URL?.replace("/api", "") ||
                    "http://localhost:5000"
                  }/uploads/${ticket.qrCode}`}
                  alt="Ticket QR Code"
                  style={{ marginTop: "10px", width: "150px" }}
                />
              )}
              <a
                href={`${
                  import.meta.env.VITE_API_URL?.replace("/api", "") ||
                  "http://localhost:5000"
                }/uploads/${ticket.qrCode}`}
                download={`ticket-${ticket._id}.png`}
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  background: "#007bff",
                  color: "white",
                  borderRadius: "5px",
                  textDecoration: "none",
                  fontSize: "14px",
                }}
              >
                ⬇️ Download QR
              </a>
            </div>
          );
        })
      )}
    </div>
  );
}
