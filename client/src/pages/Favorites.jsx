import { useEffect, useState } from "react";
import API from "../api/axios";
import EventCard from "../components/EventCard";

export default function Favorites() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const { data } = await API.get("/favorites");
        setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load favorites", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="events-page-intro">
          <div className="dashboard-title">Favorites</div>
          <div className="dashboard-subtitle">Your saved events in one place.</div>
        </div>
        {loading ? (
          <div className="dash-card">
            <div className="dash-card-body muted">Loading favorites...</div>
          </div>
        ) : events.length ? (
          <div className="events-grid">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        ) : (
          <div className="dash-card">
            <div className="dash-card-body center muted">No favorites yet.</div>
          </div>
        )}
      </div>
    </div>
  );
}
