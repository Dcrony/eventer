import { useEffect, useState } from "react";
import API from "../api/axios";
import "./CSS/home.css";
import { Link } from "react-router-dom";

export default function Home() {
  const [events, setEvents] = useState([]);
 
  useEffect(() => {
    API.get("/events")
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="home">
      <h1>TickiSpot</h1>
      {events.length === 0 && <p>No events yet.</p>}
      {events.map((event) => (
        <div
          key={event._id}
          style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}
        >
          <Link to={`/eventdetails/${events._id}`} className="link">
            <div className="topp">
              <img
                src={`http://localhost:5000/uploads/profile_pic/${event.createdBy?.profilePic}`}
                alt={event.createdBy?.username}
              />

              <h2>{event.title}</h2>
            </div>
            {event.image && (
              <img
                src={`http://localhost:5000/uploads/event_image/${event.image}`}
                alt={`${event.title} poster`}
                style={{
                  width: "100%",
                  maxHeight: "300px",
                  objectFit: "cover",
                  marginBottom: "10px",
                }}
              />
            )}

            <p>
              {event.location} • {event.date}
            </p>
            <p>Price: ₦{event.ticketPrice}</p>
            <p>Tickets Left: {event.totalTickets}</p>
          </Link>

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
        </div>
      ))}
    </div>
  );
}
