import { useEffect, useState } from "react";
import API from "../api/axios";
import LiveChat from "../components/LiveChats"; // Adjust path if needed
import "./CSS/home.css";
import { useParams } from "react-router-dom";

export default function EventDetail() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState({}); // track quantities

  const user = JSON.parse(localStorage.getItem("user"));
  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    API.get(`/events/${eventId}`)
      .then((res) => {
        setEvent(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [eventId]);

  const handleQuantityChange = (e, eventId) => {
    setBuying((prev) => ({ ...prev, [eventId]: e.target.value }));
  };

  const handleBuy = async () => {
    const quantity = parseInt(buying[event._id]) || 1;

    if (!user || !user.email) {
      alert("Login required.");
      return;
    }

    try {
      const res = await API.post("/payment/initiate", {
        email: user.email,
        amount: event.ticketPrice * quantity,
        metadata: {
          eventId: event._id,
          quantity,
        },
      });

      // Redirect to Paystack
      window.location.href = res.data.url;
    } catch (err) {
      console.error(err);
      alert("Payment failed to start");
    }
  };

  const [showChat, setShowChat] = useState(false);
  const [activeEventId, setActiveEventId] = useState(null);

  const handleJoinChat = (eventId) => {
    setActiveEventId(eventId);
    setShowChat(true);
  };

  if (loading) return <p>Loading event...</p>;
  if (!event) return <p>Event not found</p>;

  return (
    <div className="home">
      <h1>Event Details</h1>
      <h1>{event.title}</h1>
      <p>{event.description}</p>
      <p>{event.location}</p>
      <p>
        Date: {new Date(event.date).toLocaleDateString()} at {event.time}
      </p>
      <p>Price: ₦{event.ticketPrice}</p>
      <p>Tickets Left: {event.totalTickets - event.ticketsSold}</p>
      {event.image && (
        <img
          src={`${
            import.meta.env.VITE_API_URL?.replace("/api", "") ||
            "http://localhost:5000"
          }/uploads/event_image/${event.image}`}
          alt={event.title}
          style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }}
        />
      )}

      {event.liveStream?.isLive && (
        <div style={{ marginTop: "10px" }}>
          <strong style={{ color: "red" }}>🔴 LIVE NOW</strong>

          {event.liveStream.streamType === "YouTube" && (
            <iframe
              width="100%"
              height="315"
              src={event.liveStream.streamURL.replace("watch?v=", "embed/")}
              title="YouTube Live Stream"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
          )}

          {event.liveStream.streamType === "Facebook" && (
            <div
              className="fb-video"
              data-href={event.liveStream.streamURL}
              data-width="500"
              data-allowfullscreen="true"
            ></div>
          )}

          <button onClick={() => handleJoinChat(event._id)}>
            Join Live Chat
          </button>

          {/* ✅ Conditionally render chat */}
          {showChat && activeEventId === event._id && (
            <LiveChat
              eventId={event._id}
              username={user?.username || "Guest"}
            />
          )}
        </div>
      )}

      {isLoggedIn && (
        <div style={{ marginTop: "10px" }}>
          <input
            type="number"
            min="1"
            pattern="[0-9]*"
            style={{ width: "60px", marginRight: "10px" }}
            placeholder="Qty"
            value={buying[event._id] || "1"}
            onChange={(e) => handleQuantityChange(e, event._id)}
          />
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleBuy();
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy Ticket
          </a>
        </div>
      )}
    </div>
  );
}
