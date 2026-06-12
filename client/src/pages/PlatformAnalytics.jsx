import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  ExternalLink,
  Eye,
  Ticket,
  TrendingUp,
  Wallet,
  Lock,
  ArrowUpRight,
  MousePointerClick,
  CircleDollarSign,
  ChevronRight,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import API from "../api/axios";
import { getCurrentUser } from "../utils/auth";
import { isAdminRole } from "../utils/adminAccess";
import useFeatureAccess from "../hooks/useFeatureAccess";
import {
  formatCurrency,
  formatEventDate,
  formatFullNumber,
  getEventImageUrl,
} from "../utils/eventHelpers";

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, isBlurred = false, onUpgrade, accent = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        accent
          ? "border-pink-200 bg-gradient-to-br from-pink-500 to-rose-500 text-white"
          : "border-gray-200 bg-white"
      }`}
    >
      <span
        className={`block mb-1 text-[0.6rem] font-black uppercase tracking-widest ${
          accent ? "text-pink-100" : "text-gray-400"
        }`}
      >
        {label}
      </span>
      <strong
        className={`text-2xl font-black tracking-tight tabular-nums ${
          accent ? "text-white" : "text-gray-900"
        }`}
      >
        {value}
      </strong>

      {isBlurred && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/90 text-center backdrop-blur-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <Lock size={14} className="text-gray-400" />
          </div>
          <span className="text-xs font-bold text-gray-700">Pro feature</span>
          <button
            onClick={onUpgrade}
            className="text-[0.65rem] font-bold text-pink-500 underline underline-offset-2 hover:text-pink-700"
          >
            Upgrade to unlock
          </button>
        </div>
      )}
    </div>
  );
}

// ── Event thumbnail ───────────────────────────────────────────────────────────
function EventThumb({ event }) {
  const url = getEventImageUrl(event);
  if (url)
    return (
      <img
        src={url}
        alt={event.title}
        className="h-10 w-10 flex-shrink-0 rounded-xl border border-gray-200 object-cover"
      />
    );
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 text-[0.55rem] font-black text-pink-500">
      EVENT
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg text-sm">
      <p className="mb-1.5 text-[0.6rem] font-black uppercase tracking-widest text-gray-400">
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-1.5 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-gray-500">{p.name}:</span>{" "}
          <span className="font-bold text-gray-900">
            {p.dataKey === "revenue" ? formatCurrency(p.value) : formatFullNumber(p.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

// ── Chart card wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-black text-gray-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Pro gate ──────────────────────────────────────────────────────────────────
function ProGate({ onUpgrade, title, description }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-center p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
        <Lock size={22} className="text-gray-400" />
      </div>
      <div>
        <h3 className="font-black text-gray-900">{title}</h3>
        <p className="mt-1.5 max-w-xs text-sm text-gray-400 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={onUpgrade}
        className="inline-flex h-9 items-center gap-2 rounded-xl bg-pink-500 px-5 text-xs font-bold text-white shadow-md shadow-pink-500/25 transition-all hover:bg-pink-600 hover:-translate-y-0.5"
      >
        Unlock with Pro <ArrowUpRight size={13} />
      </button>
    </div>
  );
}

export default function PlatformAnalytics() {
  const user = getCurrentUser();
  const { hasAccess: hasFullAccess, promptUpgrade: promptUpgradeAnalytics } =
    useFeatureAccess("analytics");

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canOrganize =
    user?.role === "organizer" ||
    user?.isOrganizer === true ||
    isAdminRole(user?.role);

  useEffect(() => {
    if (!hasFullAccess) {
      setLoading(false);
      return;
    }
    const load = async () => {
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
    load();
  }, [hasFullAccess]);

  const basicStats = {
    totalEvents: stats?.totalEvents || 0,
    totalViews: stats?.totalViews || 0,
    totalTicketsSold: stats?.totalTicketsSold || 0,
  };

  const organizerEvents = stats?.perEventStats || [];
  const attendeePurchases = stats?.attendee?.recentPurchases || [];
  const totalViews = organizerEvents.reduce(
    (sum, e) => sum + Number(e.viewCount || 0),
    0
  );

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

  const topOrganizerEvents = useMemo(
    () =>
      [...organizerEvents]
        .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))
        .slice(0, 6)
        .map((e) => ({
          name:
            e.title?.length > 18 ? `${e.title.slice(0, 18)}…` : e.title || "Event",
          views: Number(e.viewCount || 0),
          tickets: Number(e.ticketsSold || 0),
          revenue: Number(e.revenue || 0),
        })),
    [organizerEvents]
  );

  const attendeeSpendTrend = useMemo(() => {
    const buckets = new Map();
    for (const purchase of attendeePurchases) {
      const date = new Date(purchase.purchasedAt);
      if (isNaN(date.getTime())) continue;
      const key = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      const current = buckets.get(key) || { label, spent: 0, tickets: 0 };
      current.spent += Number(purchase.amount || 0);
      current.tickets += Number(purchase.quantity || 0);
      buckets.set(key, current);
    }
    return Array.from(buckets.values()).slice(-8);
  }, [attendeePurchases]);

  const shareData = useMemo(() => {
    const orgRev = Number(stats?.totalRevenue || 0);
    const attSpent = Number(stats?.attendee?.totalSpent || 0);
    return [
      { name: "Organizer revenue", value: orgRev },
      { name: "Attendee spend", value: attSpent },
    ].filter((i) => i.value > 0);
  }, [stats]);

  const donutColors = ["#f43f8e", "#3b82f6"];

  return (
    <div className="min-h-screen bg-gray-50 font-geist">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500">
                  <BarChart3 size={14} className="text-white" />
                </div>
                <span className="text-[0.65rem] font-black uppercase tracking-widest text-pink-500">
                  Analytics
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">
                Platform analytics
              </h1>
              <p className="mt-0.5 text-sm text-gray-400">
                Track event performance, revenue, and attendee behavior.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* ── Pro upgrade banner ──────────────────────────────────────────── */}
        {!hasFullAccess && (
          <div className="flex flex-col gap-4 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 p-5 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <Lock size={18} className="text-pink-500" />
            </div>
            <div className="flex-1">
              <strong className="block font-black text-gray-900">
                Upgrade to Pro for full analytics
              </strong>
              <p className="mt-0.5 text-sm text-gray-500">
                Unlock revenue insights, charts, conversion rates, and detailed reports.
              </p>
            </div>
            <button
              onClick={promptUpgradeAnalytics}
              className="inline-flex h-9 flex-shrink-0 items-center gap-1.5 rounded-xl bg-pink-500 px-5 text-xs font-bold text-white shadow-md shadow-pink-500/25 transition-all hover:bg-pink-600 hover:-translate-y-0.5"
            >
              Upgrade to Pro <ArrowUpRight size={13} />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="animate-pulse space-y-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-gray-200" />
              ))}
            </div>
            <div className="h-80 rounded-2xl bg-gray-200" />
            <div className="h-64 rounded-2xl bg-gray-200" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-bold text-red-700">{error}</p>
          </div>
        )}

        {/* ── Overview metrics ────────────────────────────────────────────── */}
        {!loading && !error && (
          <>
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Wallet size={16} className="text-pink-500" />
                <h2 className="text-sm font-black text-gray-900">Overview</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <MetricCard
                  label="Events created"
                  value={formatFullNumber(basicStats.totalEvents)}
                />
                <MetricCard
                  label="Total views"
                  value={formatFullNumber(totalViews || basicStats.totalViews)}
                />
                <MetricCard
                  label="Tickets sold"
                  value={formatFullNumber(basicStats.totalTicketsSold)}
                />
                <MetricCard
                  label="Total revenue"
                  value={hasFullAccess ? formatCurrency(stats?.totalRevenue || 0) : "₦——"}
                  isBlurred={!hasFullAccess}
                  onUpgrade={promptUpgradeAnalytics}
                  accent={hasFullAccess}
                />
                <MetricCard
                  label="Conversion rate"
                  value={hasFullAccess ? `${conversionRate}%` : "—%"}
                  isBlurred={!hasFullAccess}
                  onUpgrade={promptUpgradeAnalytics}
                />
                <MetricCard
                  label="Avg revenue / event"
                  value={hasFullAccess ? formatCurrency(avgRevenuePerEvent) : "₦——"}
                  isBlurred={!hasFullAccess}
                  onUpgrade={promptUpgradeAnalytics}
                />
              </div>
            </section>

            {/* ── Charts section ──────────────────────────────────────────── */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-pink-500" />
                <h2 className="text-sm font-black text-gray-900">Insights & charts</h2>
              </div>

              {!hasFullAccess ? (
                <ProGate
                  onUpgrade={promptUpgradeAnalytics}
                  title="Advanced charts & insights"
                  description="Revenue trends, performance comparison, and attendee behavior are available on Pro."
                />
              ) : (
                <div className="space-y-5">
                  {/* Top events chart */}
                  <ChartCard
                    title="Top events performance"
                    subtitle="Views vs tickets sold across your best-performing events"
                  >
                    <div className="h-80 p-4">
                      {topOrganizerEvents.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={topOrganizerEvents}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f1f5f9"
                            />
                            <XAxis
                              dataKey="name"
                              tickLine={false}
                              axisLine={false}
                              fontSize={11}
                              tick={{ fill: "#94a3b8" }}
                            />
                            <YAxis
                              yAxisId="left"
                              tickLine={false}
                              axisLine={false}
                              fontSize={11}
                              tick={{ fill: "#94a3b8" }}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              tickLine={false}
                              axisLine={false}
                              fontSize={11}
                              tick={{ fill: "#94a3b8" }}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar
                              yAxisId="left"
                              dataKey="views"
                              name="Views"
                              fill="#bfdbfe"
                              radius={[5, 5, 0, 0]}
                            />
                            <Line
                              yAxisId="right"
                              dataKey="tickets"
                              name="Tickets sold"
                              stroke="#f43f8e"
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: "#f43f8e", strokeWidth: 0 }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">
                          No event data yet.
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-5 border-t border-gray-50 px-5 py-3">
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-200" />
                        Views
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-pink-500" />
                        Tickets sold
                      </span>
                    </div>
                  </ChartCard>

                  {/* Purchase trend */}
                  <ChartCard
                    title="Purchase trend"
                    subtitle="Recent attendee ticket purchases over the last 8 days"
                  >
                    <div className="h-80 p-4">
                      {attendeeSpendTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={attendeeSpendTrend}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f1f5f9"
                            />
                            <XAxis
                              dataKey="label"
                              tickLine={false}
                              axisLine={false}
                              fontSize={11}
                              tick={{ fill: "#94a3b8" }}
                            />
                            <YAxis
                              yAxisId="left"
                              tickLine={false}
                              axisLine={false}
                              fontSize={11}
                              tick={{ fill: "#94a3b8" }}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              tickLine={false}
                              axisLine={false}
                              fontSize={11}
                              tick={{ fill: "#94a3b8" }}
                            />
                            <Tooltip
                              content={<ChartTooltip />}
                              formatter={(value, name) =>
                                name === "Spent" ? formatCurrency(value) : value
                              }
                            />
                            <Bar
                              yAxisId="left"
                              dataKey="tickets"
                              name="Tickets"
                              fill="#c4b5fd"
                              radius={[5, 5, 0, 0]}
                            />
                            <Line
                              yAxisId="right"
                              dataKey="spent"
                              name="Spent"
                              stroke="#0f766e"
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: "#0f766e", strokeWidth: 0 }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">
                          No purchase data yet.
                        </div>
                      )}
                    </div>
                  </ChartCard>

                  {/* Revenue split donut */}
                  <ChartCard title="Revenue vs spend split">
                    <div className="h-72 p-4">
                      {shareData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={shareData}
                              cx="50%"
                              cy="50%"
                              innerRadius={72}
                              outerRadius={108}
                              dataKey="value"
                              nameKey="name"
                              paddingAngle={3}
                            >
                              {shareData.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={donutColors[index % donutColors.length]}
                                  strokeWidth={0}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => formatCurrency(value)}
                            />
                            <Legend
                              iconType="circle"
                              iconSize={8}
                              formatter={(value) => (
                                <span className="text-xs text-gray-600">{value}</span>
                              )}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">
                          No data to display yet.
                        </div>
                      )}
                    </div>
                  </ChartCard>
                </div>
              )}
            </section>

            {/* ── Events performance table ─────────────────────────────────── */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Eye size={16} className="text-pink-500" />
                <h2 className="text-sm font-black text-gray-900">
                  Your events performance
                </h2>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {!hasFullAccess ? (
                  <div className="relative">
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/85 backdrop-blur-sm text-center p-8">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                        <Lock size={20} className="text-gray-400" />
                      </div>
                      <p className="max-w-sm text-sm text-gray-500">
                        Detailed per-event analytics and revenue tracking are available on Pro.
                      </p>
                      <button
                        onClick={promptUpgradeAnalytics}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-pink-500 px-5 text-xs font-bold text-white shadow-md shadow-pink-500/25 transition-all hover:bg-pink-600"
                      >
                        Upgrade to Pro
                      </button>
                    </div>
                    <table className="w-full blur-sm opacity-40">
                      <thead className="border-b border-gray-100 bg-gray-50/60">
                        <tr>
                          {["Event", "Views", "Tickets", "Revenue"].map((h) => (
                            <th
                              key={h}
                              className="px-5 py-3.5 text-left text-[0.6rem] font-black uppercase tracking-widest text-gray-400"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="px-5 py-4 text-sm text-gray-500">
                              Sample Event {i + 1}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-400">—</td>
                            <td className="px-5 py-4 text-sm text-gray-400">—</td>
                            <td className="px-5 py-4 text-sm text-gray-400">—</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : organizerEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                      <Calendar size={20} className="text-gray-400" />
                    </div>
                    <p className="font-bold text-gray-700">No events yet</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Create your first event to see analytics here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/60">
                          {["Event", "Views", "Tickets sold", "Revenue", "Actions"].map(
                            (h) => (
                              <th
                                key={h}
                                className="px-5 py-3.5 text-left text-[0.6rem] font-black uppercase tracking-widest text-gray-400"
                              >
                                {h}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {organizerEvents.map((event) => (
                          <tr
                            key={event.id}
                            className="transition-colors hover:bg-gray-50/60"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <EventThumb event={event} />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-gray-900">
                                    {event.title}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {formatEventDate(event.startDate)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm tabular-nums text-gray-600">
                              {formatFullNumber(event.viewCount)}
                            </td>
                            <td className="px-5 py-4 text-sm tabular-nums text-gray-600">
                              {formatFullNumber(event.ticketsSold)}
                            </td>
                            <td className="px-5 py-4 text-sm font-black tabular-nums text-gray-900">
                              {formatCurrency(event.revenue)}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <Link
                                  to={`/event/${event.id}`}
                                  className="inline-flex h-8 items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition-all hover:border-pink-200 hover:text-pink-600"
                                >
                                  <ExternalLink size={12} /> View
                                </Link>
                                {canOrganize && (
                                  <Link
                                    to={`/events/${event.id}/analytics`}
                                    className="inline-flex h-8 items-center gap-1 rounded-xl bg-gray-900 px-3 text-xs font-semibold text-white transition-all hover:bg-gray-700"
                                  >
                                    <BarChart3 size={12} /> Details
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
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}