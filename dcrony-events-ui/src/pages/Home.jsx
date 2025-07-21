import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [buying, setBuying] = useState({}); // track quantities

  const user = JSON.parse(localStorage.getItem("user"));
  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    API.get("/events")
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleQuantityChange = (e, eventId) => {
    setBuying((prev) => ({ ...prev, [eventId]: e.target.value }));
  };



  const handleBuy = async (eventId) => {
    const quantity = parseInt(buying[eventId]) || 1;

    if (!user || !user.email) {
      alert("Login required.");
      return;
    }

    const selectedEvent = events.find((e) => e._id === eventId);
    if (!selectedEvent) {
      alert("Event not found.");
      return;
    }

    try {
      const res = await API.post("/payment/initiate", {
        email: user.email,
        amount: selectedEvent.ticketPrice * quantity,
        metadata: {
          eventId: selectedEvent._id,
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

  return (
    <div>
      <h1>TickiSpot</h1>
      {events.length === 0 && <p>No events yet.</p>}
      {events.map((event) => (
        <div
          key={event._id}
          style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}
        >
          <h2>{event.title}</h2>
          <p>
            {event.location} • {event.date}
          </p>
          <p>Price: ₦{event.ticketPrice}</p>
          <p>Tickets Left: {event.totalTickets}</p>

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
            </div>
          )}

          {isLoggedIn && (
            <div style={{ marginTop: "10px" }}>
              <input
                type="number"
                min="1"
                placeholder="Qty"
                value={buying[event._id] || ""}
                onChange={(e) => handleQuantityChange(e, event._id)}
              />
              <button onClick={() => handleBuy(event._id)} target="_blank" >Buy Ticket</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
