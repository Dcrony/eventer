import { useEffect, useMemo, useState } from "react";
import AppPage from "../components/layout/AppPage";
import { useNavigate, useParams } from "react-router-dom";
import {
  BarChart3,
  ChevronLeft,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Ticket,
  TrendingUp,
  Wallet,
  CalendarDays,
  MapPin,
  ArrowUpRight,
  MousePointerClick,
  Users,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import API from "../api/axios";
import { formatCurrency, formatEventDate, formatFullNumber } from "../utils/eventHelpers";

// ── Metric card ───────────────────────────────────────────────────────────────
const TONE_MAP = {
  blue:   { bg: "bg-blue-50",    text: "text-blue-600",    icon: "bg-blue-100",    val: "text-blue-700"    },
  pink:   { bg: "bg-pink-50",    text: "text-pink-600",    icon: "bg-pink-100",    val: "text-pink-700"    },
  green:  { bg: "bg-emerald-50", text: "text-emerald-600", icon: "bg-emerald-100", val: "text-emerald-700" },
  purple: { bg: "bg-violet-50",  text: "text-violet-600",  icon: "bg-violet-100",  val: "text-violet-700"  },
  default:{ bg: "bg-gray-50",    text: "text-gray-500",    icon: "bg-gray-100",    val: "text-gray-800"    },
};

function MetricCard({ icon: Icon, label, value, tone = "default" }) {
  const c = TONE_MAP[tone] ?? TONE_MAP.default;
  return (
    <div className={`flex items-center gap-3.5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}>
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${c.icon}`}>
        <Icon size={18} className={c.text} />
      </div>
      <div className="min-w-0">
        <p className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400">
          {label}
        </p>
        <p className={`mt-0.5 text-xl font-black tracking-tight tabular-nums ${c.val}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg text-sm">
      <p className="mb-1.5 text-xs font-black uppercase tracking-widest text-gray-400">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>{" "}
          <span className="font-bold text-gray-900">
            {typeof p.value === "number" && p.dataKey === "revenue"
              ? formatCurrency(p.value)
              : formatFullNumber(p.value)}
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

export default function EventAnalytics() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/events/${eventId}/analytics`);
        setAnalytics(data);
        setError("");
        try {
          const { data: r } = await API.get(`/referrals/${eventId}/stats`);
          setReferralStats(r || null);
        } catch {
          setReferralStats(null);
        }
      } catch (e) {
        setError(e.response?.data?.message || "Could not load analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  const summary = useMemo(() => analytics?.metrics || {}, [analytics]);
  const timeline = analytics?.charts?.timeline || [];
  const event = analytics?.event;

  const metrics = [
    { icon: Eye,           label: "Total views",      value: formatFullNumber(summary.totalViews),       tone: "blue"    },
    { icon: Ticket,        label: "Tickets sold",      value: formatFullNumber(summary.ticketsSold),      tone: "pink"    },
    { icon: Wallet,        label: "Revenue",           value: formatCurrency(summary.revenue),            tone: "green"   },
    { icon: MousePointerClick, label: "Conversion",   value: `${summary.conversionRate || 0}%`,          tone: "purple"  },
    { icon: Heart,         label: "Likes",            value: formatFullNumber(summary.likes),             tone: "default" },
    { icon: MessageCircle, label: "Comments",         value: formatFullNumber(summary.comments),          tone: "default" },
    { icon: Share2,        label: "Shares",           value: formatFullNumber(summary.shares),            tone: "default" },
    ...(referralStats
      ? [{ icon: Users, label: "Referrals", value: formatFullNumber(referralStats.totalClicks || 0), tone: "default" }]
      : []),
  ];

  return (
    <AppPage background="bg-gray-50" contentClassName="space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Pink accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-pink-500 to-fuchsia-500" />

          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
            <div className="min-w-0 space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-pink-500">
                <BarChart3 size={13} />
                Event analytics
              </div>

              <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                {event?.title || "Event performance"}
              </h1>

              <p className="max-w-lg text-sm leading-relaxed text-gray-500">
                Track discovery, ticket conversion, and audience engagement for this event.
              </p>

              {(event?.startDate || event?.location) && (
                <div className="flex flex-wrap gap-2">
                  {(event?.startDate || event?.date) && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                      <CalendarDays size={11} />
                      {formatEventDate(event.startDate || event.date)}
                    </span>
                  )}
                  {event?.location && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                      <MapPin size={11} />
                      {event.location}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-shrink-0 items-start gap-2">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-50"
              >
                <ChevronLeft size={14} />
                Back
              </button>
              <button
                onClick={() => navigate(`/event/${eventId}`)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-pink-500 px-3 text-xs font-semibold text-white shadow-md shadow-pink-200 transition-all hover:bg-pink-600"
              >
                Open event
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {loading && (
          <div className="animate-pulse space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-gray-200" />
              ))}
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="h-80 rounded-2xl bg-gray-200" />
              <div className="h-80 rounded-2xl bg-gray-200" />
            </div>
            <div className="h-60 rounded-2xl bg-gray-200" />
          </div>
        )}

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {!loading && !error && analytics && (
          <>
            {/* ── Metrics grid ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
              {metrics.map((m) => (
                <MetricCard key={m.label} {...m} />
              ))}
            </div>

            {/* ── Charts ── */}
            <div className="grid gap-5 lg:grid-cols-2">

              {/* Views & sales */}
              <ChartCard
                title="Views & ticket sales"
                subtitle="Daily performance over the last 14 days"
              >
                <div className="h-72 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timeline} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="label"
                        stroke="#94a3b8"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke="#94a3b8"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#94a3b8"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
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
                        type="monotone"
                        dataKey="ticketsSold"
                        name="Tickets sold"
                        stroke="#f43f8e"
                        strokeWidth={2.5}
                        dot={{ r: 3.5, fill: "#f43f8e", strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: "#f43f8e" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-5 border-t border-gray-50 px-5 py-3">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-200" /> Views
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-pink-500" /> Tickets sold
                  </span>
                </div>
              </ChartCard>

              {/* Revenue */}
              <ChartCard
                title="Daily revenue"
                subtitle="Ticket sales revenue over the same period"
              >
                <div className="h-72 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timeline} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="label"
                        stroke="#94a3b8"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `₦${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar
                        dataKey="revenue"
                        name="Revenue"
                        fill="#10b981"
                        radius={[5, 5, 0, 0]}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="border-t border-gray-50 px-5 py-3">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Revenue (₦)
                  </span>
                </div>
              </ChartCard>
            </div>

            {/* ── Daily breakdown table ── */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="text-sm font-black text-gray-900">Daily breakdown</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  Views, ticket sales, and revenue per day
                </p>
              </div>

              {/* Desktop */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      {["Date", "Views", "Tickets sold", "Revenue"].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3.5 text-left text-[0.6rem] font-black uppercase tracking-widest text-gray-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {timeline.length ? (
                      timeline.map((pt) => (
                        <tr
                          key={pt.dateKey}
                          className="transition-colors hover:bg-gray-50/60"
                        >
                          <td className="px-6 py-3.5 font-bold text-gray-900">
                            {pt.label}
                          </td>
                          <td className="px-6 py-3.5 tabular-nums text-gray-500">
                            {formatFullNumber(pt.views)}
                          </td>
                          <td className="px-6 py-3.5 tabular-nums text-gray-500">
                            {formatFullNumber(pt.ticketsSold)}
                          </td>
                          <td className="px-6 py-3.5 font-bold tabular-nums text-gray-900">
                            {formatCurrency(pt.revenue)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-sm text-gray-400"
                        >
                          No data available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-gray-100 sm:hidden">
                {timeline.length ? (
                  timeline.map((pt) => (
                    <div
                      key={pt.dateKey}
                      className="flex items-center justify-between gap-3 px-4 py-3.5"
                    >
                      <span className="text-sm font-bold text-gray-900">{pt.label}</span>
                      <div className="text-right text-xs text-gray-500">
                        <p>
                          {formatFullNumber(pt.views)} views ·{" "}
                          {formatFullNumber(pt.ticketsSold)} sold
                        </p>
                        <p className="font-bold text-gray-900">
                          {formatCurrency(pt.revenue)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-12 text-center text-sm text-gray-400">
                    No data available yet.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppPage>
  );
}