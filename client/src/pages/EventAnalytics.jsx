import { useEffect, useMemo, useState } from "react";
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
import Button from "../components/ui/button";
import { formatCurrency, formatEventDate, formatFullNumber } from "../utils/eventHelpers";

/* ── Metric card ── */
const TONE_STYLES = {
  default: "from-slate-800 to-slate-900",
  blue:    "from-blue-600   to-blue-700",
  pink:    "from-pink-500   to-rose-600",
  green:   "from-emerald-500 to-emerald-700",
  purple:  "from-violet-600  to-violet-800",
};

function MetricCard({ icon: Icon, label, value, tone = "default" }) {
  return (
    <article className={`relative flex items-start justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br  shadow-md overflow-hidden ${TONE_STYLES[tone] ?? TONE_STYLES.default}`}>
      {/* Subtle circle decoration */}
      <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/5" />
      <div>
        <span className="block text-xs font-semibold opacity-75 uppercase tracking-widest mb-1">{label}</span>
        <strong className="block text-2xl font-extrabold tracking-tight leading-none text-black">{value}</strong>
      </div>
      <div className="shrink-0 w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
        <Icon size={18} />
      </div>
    </article>
  );
}

/* ── Custom tooltip ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-bold text-slate-900 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-slate-600">
          <span className="font-semibold" style={{ color: p.color }}>{p.name}:</span>{" "}
          {typeof p.value === "number" && p.dataKey === "revenue"
            ? formatCurrency(p.value)
            : formatFullNumber(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function EventAnalytics() {
  const { eventId } = useParams();
  const navigate    = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/events/${eventId}/analytics`);
        setAnalytics(data);
        setError("");
      } catch (e) {
        setError(e.response?.data?.message || "Could not load analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  const summary  = useMemo(() => analytics?.metrics || {}, [analytics]);
  const timeline = analytics?.charts?.timeline || [];
  const event    = analytics?.event;

  const metrics = [
    { icon: Eye,         label: "Total views",      value: formatFullNumber(summary.totalViews),          tone: "blue"    },
    { icon: Ticket,      label: "Tickets sold",     value: formatFullNumber(summary.ticketsSold),         tone: "pink"    },
    { icon: Wallet,      label: "Revenue",          value: formatCurrency(summary.revenue),               tone: "green"   },
    { icon: TrendingUp,  label: "Conversion rate",  value: `${summary.conversionRate || 0}%`,             tone: "purple"  },
    { icon: Heart,       label: "Likes",            value: formatFullNumber(summary.likes),               tone: "default" },
    { icon: MessageCircle, label: "Comments",       value: formatFullNumber(summary.comments),            tone: "default" },
    { icon: Share2,      label: "Shares",           value: formatFullNumber(summary.shares),              tone: "default" },
  ];

  return (
    /*
      pl-[var(--sidebar-width)] ensures the content never sits under the sidebar.
      The CSS variable --sidebar-width is set dynamically by the Sidebar component
      (5rem collapsed / 15rem expanded).
    */
    <div className="min-h-screen bg-slate-50 pl-[var(--sidebar-width,0px)] pr-4 sm:pr-8 pt-6 pb-16 transition-[padding-left] duration-300">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Pink top accent */}
          <div className="h-1 w-full bg-gradient-to-r from-pink-500 to-fuchsia-500" />

          <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            {/* Copy */}
            <div className="space-y-3 min-w-0">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-pink-500">
                <BarChart3 size={13} />
                Event analytics
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {event?.title || "Event performance"}
              </h1>

              <p className="text-sm text-slate-500 max-w-lg leading-relaxed">
                Track discovery, ticket conversion, and audience engagement for this event in one place.
              </p>

              {/* Meta pills */}
              {(event?.startDate || event?.location) && (
                <div className="flex flex-wrap gap-2">
                  {(event?.startDate || event?.date) && (
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                      <CalendarDays size={12} />
                      {formatEventDate(event.startDate || event.date)}
                    </span>
                  )}
                  {event?.location && (
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                      <MapPin size={12} />
                      {event.location}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-start gap-2 shrink-0">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <ChevronLeft size={15} />
                Back
              </button>
              <button
                onClick={() => navigate(`/Eventdetail/${eventId}`)}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 shadow-md shadow-pink-200 transition-all"
              >
                Open event
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-[3px] border-pink-200 border-t-pink-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Loading analytics…</p>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* ── Content ── */}
        {!loading && !error && analytics && (
          <>
            {/* ── Metrics grid ── */}
            <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {metrics.map((m) => (
                <MetricCard key={m.label} {...m} />
              ))}
            </section>

            {/* ── Charts grid ── */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Views & sales chart */}
              <article className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 pt-5 pb-2">
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Views & sales over time</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Daily performance across the last 14 days</p>
                </div>
                <div className="h-72 px-2 pb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timeline} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left"  stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar yAxisId="left" dataKey="views" name="Views" fill="#3b82f6" radius={[6,6,0,0]} />
                      <Line yAxisId="right" type="monotone" dataKey="ticketsSold" name="Tickets sold" stroke="#f43f8e" strokeWidth={2.5} dot={{ r: 3, fill: "#f43f8e" }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </article>

              {/* Revenue chart */}
              <article className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 pt-5 pb-2">
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Daily revenue</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Ticket sales revenue over the same period</p>
                </div>
                <div className="h-72 px-2 pb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timeline} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[6,6,0,0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </section>

            {/* ── Daily breakdown table ── */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Daily breakdown</h2>
                <p className="text-xs text-slate-400 mt-0.5">Quick operational view — views, sales, and revenue per day</p>
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["Date", "Views", "Tickets sold", "Revenue"].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {timeline.length ? timeline.map((pt) => (
                      <tr key={pt.dateKey} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3.5 font-semibold text-slate-900">{pt.label}</td>
                        <td className="px-6 py-3.5 text-slate-600">{formatFullNumber(pt.views)}</td>
                        <td className="px-6 py-3.5 text-slate-600">{formatFullNumber(pt.ticketsSold)}</td>
                        <td className="px-6 py-3.5 font-bold text-slate-900">{formatCurrency(pt.revenue)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">No data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile stacked rows */}
              <div className="sm:hidden divide-y divide-slate-100">
                {timeline.length ? timeline.map((pt) => (
                  <div key={pt.dateKey} className="px-4 py-3.5 flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900 text-sm">{pt.label}</span>
                    <div className="text-right text-xs text-slate-500 space-y-0.5">
                      <p>{formatFullNumber(pt.views)} views · {formatFullNumber(pt.ticketsSold)} sold</p>
                      <p className="font-bold text-slate-900">{formatCurrency(pt.revenue)}</p>
                    </div>
                  </div>
                )) : (
                  <div className="px-4 py-10 text-center text-sm text-slate-400">No data available.</div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}