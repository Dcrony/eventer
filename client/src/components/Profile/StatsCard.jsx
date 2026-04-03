export default function StatsCard({ stats }) {
  return (
    <div className="stats">
      <div>
        <h3>{stats.followers}</h3>
        <p>Followers</p>
      </div>

      <div>
        <h3>{stats.following}</h3>
        <p>Following</p>
      </div>

      <div>
        <h3>{stats.events}</h3>
        <p>Events</p>
      </div>
    </div>
  );
}