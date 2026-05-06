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
import "./CSS/EventAnalytics.css";

function MetricCard({ icon: Icon, label, value, tone = "default" }) {
  return (
    <article className={`event-analytics-metric tone-${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <Icon size={20} />
    </article>
  );
}

export default function EventAnalytics() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/events/${eventId}/analytics`);
        setAnalytics(data);
        setError("");
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || "Could not load event analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [eventId]);

  const summary = useMemo(() => analytics?.metrics || {}, [analytics]);
  const timeline = analytics?.charts?.timeline || [];
  const event = analytics?.event;

  return (
    <div className="dashboard-page">
      <div className="dashboard-container event-analytics-page">
        <div className="event-analytics-header glass-panel">
          <div className="event-analytics-header-copy">
            <span className="section-eyebrow">
              <BarChart3 size={14} />
              Event analytics
            </span>
            <h1>{event?.title || "Event performance"}</h1>
            <p>
              Track discovery, ticket conversion, and audience engagement for this event in one
              place.
            </p>
            <div className="event-analytics-header-meta">
              <span>{formatEventDate(event?.startDate || event?.date)}</span>
              <span>{event?.location || "Online event"}</span>
            </div>
          </div>

          <div className="event-analytics-header-actions">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              <ChevronLeft size={16} />
              Back
            </Button>
            <Button onClick={() => navigate(`/Eventdetail/${eventId}`)}>Open event page</Button>
          </div>
        </div>

        {loading ? (
          <div className="glass-panel event-analytics-state">Loading analytics...</div>
        ) : null}

        {!loading && error ? (
          <div className="glass-panel event-analytics-state is-error">
            <p>{error}</p>
          </div>
        ) : null}

        {!loading && !error && analytics ? (
          <>
            <section className="event-analytics-metrics-grid">
              <MetricCard icon={Eye} label="Total views" value={formatFullNumber(summary.totalViews)} tone="blue" />
              <MetricCard icon={Ticket} label="Tickets sold" value={formatFullNumber(summary.ticketsSold)} tone="pink" />
              <MetricCard icon={Wallet} label="Revenue" value={formatCurrency(summary.revenue)} tone="green" />
              <MetricCard
                icon={TrendingUp}
                label="Conversion rate"
                value={`${summary.conversionRate || 0}%`}
                tone="purple"
              />
              <MetricCard icon={Heart} label="Likes" value={formatFullNumber(summary.likes)} />
              <MetricCard icon={MessageCircle} label="Comments" value={formatFullNumber(summary.comments)} />
              <MetricCard icon={Share2} label="Shares" value={formatFullNumber(summary.shares)} />
            </section>

            <section className="event-analytics-charts-grid">
              <article className="glass-panel event-analytics-chart-card">
                <div className="event-analytics-chart-head">
                  <div>
                    <h2>Views and sales over time</h2>
                    <p>Daily performance across the last 14 days.</p>
                  </div>
                </div>
                <div className="event-analytics-chart">
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={timeline}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(96, 112, 137, 0.16)" />
                      <XAxis dataKey="label" stroke="#607089" tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="#607089" tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" stroke="#607089" tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="views" fill="#0f4c81" radius={[8, 8, 0, 0]} />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="ticketsSold"
                        stroke="#ff5a5f"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="glass-panel event-analytics-chart-card">
                <div className="event-analytics-chart-head">
                  <div>
                    <h2>Daily revenue</h2>
                    <p>Ticket sales revenue over the same period.</p>
                  </div>
                </div>
                <div className="event-analytics-chart">
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={timeline}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(96, 112, 137, 0.16)" />
                      <XAxis dataKey="label" stroke="#607089" tickLine={false} axisLine={false} />
                      <YAxis stroke="#607089" tickLine={false} axisLine={false} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="revenue" fill="#0f9f6e" radius={[8, 8, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </section>

            <section className="event-analytics-table glass-panel">
              <div className="event-analytics-chart-head">
                <div>
                  <h2>Daily breakdown</h2>
                  <p>A quick operational view of views, ticket sales, and revenue.</p>
                </div>
              </div>
              <div className="event-analytics-table-grid">
                {timeline.map((point) => (
                  <div key={point.dateKey} className="event-analytics-table-row">
                    <strong>{point.label}</strong>
                    <span>{formatFullNumber(point.views)} views</span>
                    <span>{formatFullNumber(point.ticketsSold)} sales</span>
                    <span>{formatCurrency(point.revenue)}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
