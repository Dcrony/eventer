import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    API.get("/events/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!stats) return <p>Loading stats...</p>;

  return (
    <div>
      <h2>📊 Dashboard</h2>
      <div style={{ display: "grid", gap: "1rem" }}>
        <StatCard title="Total Events" value={stats.totalEvents} />
        <StatCard title="Tickets Sold" value={stats.totalTicketsSold} />
        <StatCard title="Revenue (₦)" value={stats.totalRevenue} />
        <StatCard title="Live Events" value={stats.currentlyLive} />
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
      <h3>{title}</h3>
      <p style={{ fontSize: 24, fontWeight: "bold" }}>{value}</p>
    </div>
  );
}
