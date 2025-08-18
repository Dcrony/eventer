import { useEffect, useState } from "react";
import API from "../api/axios";
import "./CSS/home.css";
import { Link } from "react-router-dom";

export default function Home() {
  const [events, setEvents] = useState([]);
<<<<<<< HEAD
 
=======
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [buying, setBuying] = useState({}); // track quantities
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const isLoggedIn = !!localStorage.getItem("token");

>>>>>>> 6f8f32bcf2ee8a08f7d278f505e87984c325b50c
  useEffect(() => {
    setLoading(true);
    setError(null);
    API.get("/events")
      .then((res) => {
        setEvents(res.data);
        setFilteredEvents(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load events. Please try again.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="home">
      <h1>TickiSpot</h1>
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '24px' }}>⏳</div>
          <p>Loading events...</p>
        </div>
      )}
      
      {error && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
          <p>❌ {error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      )}
      
      {!loading && !error && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search events by title or location..."
              value={searchTerm}
              onChange={(e) => {
                const term = e.target.value;
                setSearchTerm(term);
                const filtered = events.filter(event =>
                  event.title.toLowerCase().includes(term.toLowerCase()) ||
                  event.location.toLowerCase().includes(term.toLowerCase())
                );
                setFilteredEvents(filtered);
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                fontSize: '16px'
              }}
            />
          </div>
          
          {filteredEvents.length === 0 && searchTerm && (
            <p>No events found matching "{searchTerm}"</p>
          )}
          
          {filteredEvents.length === 0 && !searchTerm && (
            <p>No events yet.</p>
          )}
          
          {filteredEvents.map((event) => (
        <div
          key={event._id}
          style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}
        >
          <Link to={`/eventdetails/${events._id}`} className="link">
            <div className="topp">
              <img
<<<<<<< HEAD
                src={`http://localhost:5000/uploads/profile_pic/${event.createdBy?.profilePic}`}
                alt={event.createdBy?.username}
=======
                src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${event.createdBy?.profilePic}`}
                alt={event.createdBy?.username || "Creator"}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
>>>>>>> 6f8f32bcf2ee8a08f7d278f505e87984c325b50c
              />
              <div style={{ display: 'none', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ccc', alignItems: 'center', justifyContent: 'center' }}>
                {event.createdBy?.username?.charAt(0) || 'U'}
              </div>

              <h2>{event.title}</h2>
            </div>
            {event.image && (
              <img
                src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/event_image/${event.image}`}
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
            )}

            <p>
              {event.location} • {new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
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
        </>
      )}
    </div>
  );
}
