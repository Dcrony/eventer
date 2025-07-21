import { useEffect, useState } from "react";
import API from "../api/axios";

export default function StatsDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    API.get("/events/stats")
      .then((res) => setStats(res.data))
      .catch((err) => {
        console.error("Stats Error:", err);
      });
  }, []);

  if (!stats) return <p>Loading stats...</p>;

  return (
    <div>
      <h2>📊 Dcrony Event Stats</h2>
      <p>Total Events: {stats.totalEvents}</p>
      <p>Total Tickets Sold: {stats.totalTickets}</p>
      <p>Total Revenue: ₦{stats.totalRevenue}</p>

      <h3>🏆 Top Events</h3>
      {stats.topEvents.length === 0 ? (
        <p>No events yet.</p>
      ) : (
        <ul>
          {stats.topEvents.map((event, i) => (
            <li key={i}>
              {event.title} — {event.quantitySold} tickets
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
