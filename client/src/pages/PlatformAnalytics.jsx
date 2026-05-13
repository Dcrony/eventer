import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Calendar, ExternalLink, Eye, Ticket, TrendingUp, Wallet, Lock, Sparkles } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import API from "../api/axios";
import { getCurrentUser } from "../utils/auth";
import useFeatureAccess from "../hooks/useFeatureAccess";
import { promptUpgrade } from "../utils/planAccess";
import {
  formatCurrency,
  formatEventDate,
  formatFullNumber,
  getEventImageUrl,
} from "../utils/eventHelpers";

function MetricCard({ label, value, isBlurred = false, onUpgrade }) {
  return (
    <div className={`relative overflow-hidden p-5 rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-pink-200/40 ${isBlurred ? "blurred-metric" : ""}`}>
      <div className="absolute top-0 right-0 w-2/5 h-0.5 bg-gradient-to-r from-transparent to-pink-500 rounded-tr-xl" />
      <span className="block mb-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <strong className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">
        {value}
      </strong>
      {isBlurred && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2 rounded-xl text-center p-4 z-10">
          <Lock size={20} className="text-gray-400" />
          <span className="font-bold text-sm text-gray-700">Pro Feature</span>
          <button onClick={onUpgrade} className="text-xs font-semibold text-pink-500 underline hover:text-pink-600">
            Upgrade to unlock
          </button>
        </div>
      )}
    </div>
  );
}

function EventThumb({ event }) {
  const url = getEventImageUrl(event);
  if (url) {
    return <img src={url} alt={event.title} className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" />;
  }
  return (
    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-pink-100/60 to-blue-100/40 text-pink-500 text-[0.6rem] font-extrabold tracking-wide border border-gray-200 flex-shrink-0">
      EVENT
    </div>
  );
}

export default function PlatformAnalytics() {
  const user = getCurrentUser();
  const { hasAccess: hasFullAccess, promptUpgrade: promptUpgradeAnalytics } = useFeatureAccess("analytics");

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canOrganize = user?.role === "organizer" || user?.isOrganizer === true || user?.role === "admin";

  useEffect(() => {
    if (!hasFullAccess) {
      setLoading(false);
      return;
    }

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const { data } = await API.get("/analytics/overview");
        setStats(data);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [hasFullAccess]);

  const basicStats = {
    totalEvents: stats?.totalEvents || 0,
    totalViews: stats?.totalViews || 1240,
    totalTicketsSold: stats?.totalTicketsSold || 0,
  };

  const organizerEvents = stats?.perEventStats || [];
  const attendeePurchases = stats?.attendee?.recentPurchases || [];

  const totalViews = organizerEvents.reduce((sum, event) => sum + Number(event.viewCount || 0), 0);

  const conversionRate = useMemo(() => {
    const views = Number(stats?.totalViews || 0);
    const sold = Number(stats?.totalTicketsSold || 0);
    if (!views) return 0;
    return Number(((sold / views) * 100).toFixed(1));
  }, [stats]);

  const avgRevenuePerEvent = useMemo(() => {
    const revenue = Number(stats?.totalRevenue || 0);
    const events = Number(stats?.totalEvents || 0);
    return events ? revenue / events : 0;
  }, [stats]);

  const topOrganizerEvents = useMemo(() => {
    return [...organizerEvents]
      .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))
      .slice(0, 6)
      .map((event) => ({
        name: event.title?.length > 20 ? `${event.title.slice(0, 20)}...` : event.title || "Event",
        views: Number(event.viewCount || 0),
        tickets: Number(event.ticketsSold || 0),
        revenue: Number(event.revenue || 0),
      }));
  }, [organizerEvents]);

  const attendeeSpendTrend = useMemo(() => {
    const buckets = new Map();
    for (const purchase of attendeePurchases) {
      const date = new Date(purchase.purchasedAt);
      if (isNaN(date.getTime())) continue;
      const key = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const current = buckets.get(key) || { label, spent: 0, tickets: 0 };
      current.spent += Number(purchase.amount || 0);
      current.tickets += Number(purchase.quantity || 0);
      buckets.set(key, current);
    }
    return Array.from(buckets.values()).slice(-8);
  }, [attendeePurchases]);

  const revenueSalesTrendData = useMemo(() => {
    return organizerEvents.map((e) => ({
      label: e.title?.length > 25 ? `${e.title.slice(0, 25)}…` : e.title || "Event",
      revenue: Number(e.revenue || 0),
      ticketsSold: Number(e.ticketsSold || 0),
    }));
  }, [organizerEvents]);

  const shareData = useMemo(() => {
    const orgRev = Number(stats?.totalRevenue || 0);
    const attSpent = Number(stats?.attendee?.totalSpent || 0);
    return [
      { name: "Organizer Revenue", value: orgRev },
      { name: "Attendee Spend", value: attSpent },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const donutColors = ["#ec4899", "#3b82f6"];

  return (
    <div className="min-h-screen bg-gray-50 font-geist lg:pl-[calc(var(--sidebar-width,0px)+1.5rem)] py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="relative mb-6 p-5 sm:p-6 md:p-8 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse,rgba(244,63,142,0.12)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-400 text-[0.65rem] font-bold uppercase tracking-wider mb-4">
              <BarChart3 size={14} /> ANALYTICS
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2">
              Platform Analytics
            </h1>
            <p className="text-gray-300 text-sm max-w-2xl leading-relaxed">
              Track your events performance, revenue, and attendee behavior.
            </p>
          </div>
        </div>

        {/* Pro Upgrade Banner */}
        {!hasFullAccess && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border border-purple-200 mb-6">
            <Lock size={22} className="text-pink-500 flex-shrink-0" />
            <div className="flex-1">
              <strong className="font-bold text-gray-900 block mb-0.5">Upgrade to Pro for full analytics</strong>
              <p className="text-sm text-gray-500 m-0">Unlock revenue insights, charts, conversion rates, and detailed reports.</p>
            </div>
            <button onClick={promptUpgradeAnalytics} className="px-5 py-2.5 rounded-full bg-pink-500 text-white font-bold text-sm transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/25">
              Upgrade to Pro
            </button>
          </div>
        )}

        {/* Loading & Error States */}
        {loading && (
  <div className="space-y-4 animate-pulse">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 shadow-sm" />
      ))}
    </div>
    <div className="h-80 bg-white rounded-2xl border border-gray-200 shadow-sm" />
    <div className="h-64 bg-white rounded-2xl border border-gray-200 shadow-sm" />
  </div>
)}
        
        {error && (
          <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-8 text-center">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* Overview Metrics */}
        <section className="mb-6 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-gray-900 mb-4">
            <Wallet size={18} className="text-pink-500" /> Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <MetricCard label="Events Created" value={formatFullNumber(basicStats.totalEvents)} />
            <MetricCard label="Total Views" value={formatFullNumber(totalViews || basicStats.totalViews)} />
            <MetricCard label="Tickets Sold" value={formatFullNumber(basicStats.totalTicketsSold)} />
            <MetricCard
              label="Total Revenue"
              value={hasFullAccess ? formatCurrency(stats?.totalRevenue || 0) : "₦——"}
              isBlurred={!hasFullAccess}
              onUpgrade={promptUpgradeAnalytics}
            />
            <MetricCard
              label="Conversion Rate"
              value={hasFullAccess ? `${conversionRate}%` : "—"}
              isBlurred={!hasFullAccess}
              onUpgrade={promptUpgradeAnalytics}
            />
            <MetricCard
              label="Avg Revenue per Event"
              value={hasFullAccess ? formatCurrency(avgRevenuePerEvent) : "—"}
              isBlurred={!hasFullAccess}
              onUpgrade={promptUpgradeAnalytics}
            />
          </div>
        </section>

        {/* Charts Section */}
        <section className="mb-6 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-gray-900 mb-4">
            <TrendingUp size={18} className="text-pink-500" /> Insights & Charts
          </h2>

          {!hasFullAccess ? (
            <div className="relative min-h-[400px] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 overflow-hidden">
              <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-10 text-center p-6">
                <Lock size={32} className="text-gray-400" />
                <h3 className="text-lg font-extrabold text-gray-900">Advanced Charts & Insights</h3>
                <p className="text-sm text-gray-500 max-w-md">Revenue trends, performance comparison, and attendee behavior are Pro features.</p>
                <button onClick={promptUpgradeAnalytics} className="px-6 py-2.5 rounded-full bg-pink-500 text-white font-bold text-sm transition-all duration-200 hover:bg-pink-600 shadow-md">
                  Unlock with Pro
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Top Events Performance */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Top Events Performance</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Views vs Tickets Sold</p>
                </div>
                <div className="h-80 p-3">
                  {topOrganizerEvents.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={topOrganizerEvents}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="views" name="Views" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                        <Line yAxisId="right" dataKey="tickets" name="Tickets Sold" stroke="#ec4899" strokeWidth={3} dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">No event data yet.</div>
                  )}
                </div>
              </div>

              {/* Purchase Trend */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Purchase Trend</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Recent attendee activity</p>
                </div>
                <div className="h-80 p-3">
                  {attendeeSpendTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={attendeeSpendTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} fontSize={12} />
                        <Tooltip formatter={(value, name) => (name === "Spent" ? formatCurrency(value) : value)} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="tickets" name="Tickets" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        <Line yAxisId="right" dataKey="spent" name="Spent" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">No purchase data yet.</div>
                  )}
                </div>
              </div>

              {/* Revenue Split Donut */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Revenue vs Spend Split</h3>
                </div>
                <div className="h-80 p-3">
                  {shareData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={shareData}
                          cx="50%"
                          cy="50%"
                          innerRadius={68}
                          outerRadius={104}
                          dataKey="value"
                          nameKey="name"
                          paddingAngle={2}
                        >
                          {shareData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data to display yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Events Performance Table */}
        <section className="mb-6 rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-gray-900">
              <Eye size={18} className="text-pink-500" /> Your Events Performance
            </h2>
          </div>

          {!hasFullAccess ? (
            <div className="relative min-h-[300px] overflow-hidden">
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10 text-center p-6">
                <Lock size={28} className="text-gray-400" />
                <p className="text-sm text-gray-500 max-w-md">Detailed per-event analytics and revenue tracking are available on Pro.</p>
                <button onClick={promptUpgradeAnalytics} className="px-5 py-2 rounded-full bg-pink-500 text-white font-bold text-sm transition-all duration-200 hover:bg-pink-600 shadow-md">
                  Upgrade to Pro
                </button>
              </div>
              <table className="w-full border-collapse opacity-50 blur-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left p-3 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Event</th>
                    <th className="text-left p-3 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Views</th>
                    <th className="text-left p-3 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Tickets</th>
                    <th className="text-left p-3 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="p-3 text-gray-500">Sample Event {i + 1}</td>
                      <td className="p-3 text-gray-400">—</td>
                      <td className="p-3 text-gray-400">—</td>
                      <td className="p-3 text-gray-400">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : organizerEvents.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">You haven't created any events yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50/60 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-3 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Event</th>
                    <th className="text-left p-3 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Views</th>
                    <th className="text-left p-3 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Tickets Sold</th>
                    <th className="text-left p-3 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Revenue</th>
                    <th className="text-left p-3 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organizerEvents.map((event) => (
                    <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <EventThumb event={event} />
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-gray-900 truncate">{event.title}</h4>
                            <span className="text-xs text-gray-400">{formatEventDate(event.startDate)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm font-medium text-gray-700">{formatFullNumber(event.viewCount)}</td>
                      <td className="p-3 text-sm font-medium text-gray-700">{formatFullNumber(event.ticketsSold)}</td>
                      <td className="p-3 text-sm font-bold text-gray-900">{formatCurrency(event.revenue)}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/event/${event.id}`} className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-gray-200 bg-white text-gray-600 text-xs font-semibold transition-all duration-200 hover:border-pink-300 hover:text-pink-500">
                            <ExternalLink size={14} /> View
                          </Link>
                          {canOrganize && (
                            <Link to={`/events/${event.id}/analytics`} className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-pink-500 text-white text-xs font-semibold transition-all duration-200 hover:bg-pink-600 shadow-sm">
                              <BarChart3 size={14} /> Details
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}