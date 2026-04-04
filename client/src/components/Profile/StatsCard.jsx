export default function StatsCard({ stats }) {
  return (
    <div className="stats-card">
      <div className="stat-item">
        <h3>{stats.followers}</h3>
        <p>Followers</p>
      </div>

      <div className="stat-divider"></div>

      <div className="stat-item">
        <h3>{stats.following}</h3>
        <p>Following</p>
      </div>

      <div className="stat-divider"></div>

      <div className="stat-item">
        <h3>{stats.events}</h3>
        <p>Events</p>
      </div>
    </div>
  );
}