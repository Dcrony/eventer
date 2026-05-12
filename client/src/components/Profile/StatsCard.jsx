import { Users, UserPlus, CalendarDays } from "lucide-react";

export default function StatsCard({ stats, onStatClick }) {
  const statsItems = [
    { key: "followers", label: "Followers", icon: Users, value: stats?.followers || 0 },
    { key: "following", label: "Following", icon: UserPlus, value: stats?.following || 0 },
    { key: "events", label: "Events", icon: CalendarDays, value: stats?.events || 0 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Profile Stats</h3>
      <div className="space-y-3">
        {statsItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onStatClick?.(item.key)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 transition-all duration-200 hover:border-pink-200 hover:bg-pink-50 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500 group-hover:bg-pink-200 transition-colors">
                <item.icon size={16} />
              </div>
              <span className="text-sm font-semibold text-gray-700">{item.label}</span>
            </div>
            <span className="text-lg font-extrabold text-gray-900 group-hover:text-pink-500 transition-colors">
              {item.value.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      {/* Optional: Engagement rate if available */}
      {stats?.engagementRate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">Engagement Rate</span>
            <span className="font-bold text-gray-900">{stats.engagementRate}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stats.engagementRate, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}