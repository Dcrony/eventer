import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Calendar, ExternalLink, Eye, Ticket, TrendingUp, Wallet } from "lucide-react";
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
import usePlanAccess from "../hooks/usePlanAccess";
import { promptUpgrade } from "../utils/planAccess";
import {
  formatCurrency,
  formatEventDate,
  formatFullNumber,
  getEventImageUrl,
} from "../utils/eventHelpers";
import "./CSS/Analytics.css";

function MetricCard({ label, value }) {
  return (
    <article className="analytics-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function EventThumb({ event }) {
  const url = getEventImageUrl(event);
  if (url) {
    return (
      <img
        src={url}
        alt={event.title || "Event"}
        className="analytics-event-thumb"
      />
    );
  }

  return <div className="analytics-event-thumb analytics-event-thumb--placeholder">EVENT</div>;
}

export default function PlatformAnalytics() {
  const user = getCurrentUser();
  const canAccessAnalytics = usePlanAccess("analytics");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canOrganize =
    user?.role === "organizer" || user?.isOrganizer === true || user?.role === "admin";

  useEffect(() => {
    if (!canAccessAnalytics) {
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
  }, [canAccessAnalytics]);

  const organizerEvents = stats?.perEventStats || [];
  const attendeePurchases = stats?.attendee?.recentPurchases || [];

  const attendeeByEvent = useMemo(() => {
    const grouped = new Map();
    for (const purchase of attendeePurchases) {
      if (!purchase.event?._id) continue;
      const key = String(purchase.event._id);
      if (!grouped.has(key)) {
        grouped.set(key, {
          event: purchase.event,
          purchases: 0,
          tickets: 0,
          spent: 0,
          lastPurchaseAt: purchase.purchasedAt,
        });
      }
      const row = grouped.get(key);
      row.purchases += 1;
      row.tickets += Number(purchase.quantity || 0);
      row.spent += Number(purchase.amount || 0);
      if (new Date(purchase.purchasedAt) > new Date(row.lastPurchaseAt)) {
        row.lastPurchaseAt = purchase.purchasedAt;
      }
    }
    return Array.from(grouped.values()).sort(
      (a, b) => new Date(b.lastPurchaseAt) - new Date(a.lastPurchaseAt),
    );
  }, [attendeePurchases]);

  const topOrganizerEvents = useMemo(() => {
    return [...organizerEvents]
      .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))
      .slice(0, 6)
      .map((event) => ({
        id: event.id,
        name: event.title?.length > 20 ? `${event.title.slice(0, 20)}...` : event.title || "Event",
        views: Number(event.viewCount || 0),
        tickets: Number(event.ticketsSold || 0),
        revenue: Number(event.revenue || 0),
      }));
  }, [organizerEvents]);

  /** Per-event series for revenue vs tickets (all events you created). */
  const revenueSalesTrendData = useMemo(() => {
    return organizerEvents.map((e) => ({
      label:
        e.title && e.title.length > 28 ? `${e.title.slice(0, 28)}…` : e.title || "Event",
      revenue: Number(e.revenue || 0),
      ticketsSold: Number(e.ticketsSold || 0),
    }));
  }, [organizerEvents]);

  const attendeeSpendTrend = useMemo(() => {
    const buckets = new Map();
    for (const purchase of attendeePurchases) {
      const rawDate = purchase.purchasedAt ? new Date(purchase.purchasedAt) : null;
      if (!rawDate || Number.isNaN(rawDate.getTime())) continue;
      const key = rawDate.toISOString().slice(0, 10);
      const label = rawDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const current = buckets.get(key) || { dateKey: key, label, spent: 0, tickets: 0 };
      current.spent += Number(purchase.amount || 0);
      current.tickets += Number(purchase.quantity || 0);
      buckets.set(key, current);
    }

    return Array.from(buckets.values())
      .sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey))
      .slice(-8);
  }, [attendeePurchases]);

  const shareData = useMemo(() => {
    const organizerRevenue = Number(stats?.totalRevenue || 0);
    const attendeeSpent = Number(stats?.attendee?.totalSpent || 0);
    return [
      { name: "Organizer revenue", value: organizerRevenue },
      { name: "Attendee spend", value: attendeeSpent },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const conversionRate = useMemo(() => {
    const views = Number(stats?.totalViews || 0);
    const sold = Number(stats?.totalTicketsSold || 0);
    if (!views) return 0;
    return Number(((sold / views) * 100).toFixed(2));
  }, [stats]);

  const avgRevenuePerEvent = useMemo(() => {
    const totalRevenue = Number(stats?.totalRevenue || 0);
    const totalEvents = Number(stats?.totalEvents || 0);
    if (!totalEvents) return 0;
    return totalRevenue / totalEvents;
  }, [stats]);

  const totalViews = organizerEvents.reduce((sum, event) => sum + Number(event.viewCount || 0), 0);
  const donutColors = ["#db2777", "#3b82f6"];

  return (
    <div className="dashboard-page analytics-page">
      <div className="dashboard-container">
        <header className="analytics-hero">
          <span className="analytics-hero-eyebrow">
            <BarChart3 size={14} />
            Analytics
          </span>
          <h1>Platform analytics</h1>
          <p>
            Use this dashboard to track your overall activity and each event’s performance.
          </p>
        </header>

        {!canAccessAnalytics ? (
          <div className="glass-panel analytics-state">
            <h3>Upgrade to Pro to unlock advanced analytics</h3>
            <p>Charts, revenue insights, and per-event performance are available during trial and on Pro.</p>
            <button
              type="button"
              className="analytics-btn analytics-btn--primary"
              onClick={() => promptUpgrade("analytics")}
            >
              Upgrade to Pro
            </button>
          </div>
        ) : null}

        {loading ? <div className="glass-panel analytics-state">Loading analytics…</div> : null}
        {canAccessAnalytics && !loading && error ? <div className="glass-panel analytics-state is-error">{error}</div> : null}

        {canAccessAnalytics && !loading && !error && stats ? (
          <>
            <section className="analytics-section">
              <h2 className="analytics-section-title">
                <Wallet size={18} />
                Your platform overview
              </h2>
              <p className="analytics-section-desc">
                Combined organizer and attendee metrics for your account.
              </p>
              <div className="analytics-metrics">
                <MetricCard label="Events created" value={formatFullNumber(stats.totalEvents)} />
                <MetricCard label="Tickets sold (your events)" value={formatFullNumber(stats.totalTicketsSold)} />
                <MetricCard label="Revenue (your events)" value={formatCurrency(stats.totalRevenue)} />
                <MetricCard label="Currently live events" value={formatFullNumber(stats.currentlyLive)} />
                <MetricCard label="Total event views" value={formatFullNumber(totalViews)} />
                <MetricCard label="Conversion rate" value={`${conversionRate}%`} />
                <MetricCard label="Avg revenue per event" value={formatCurrency(avgRevenuePerEvent)} />
                <MetricCard label="Tickets purchased" value={formatFullNumber(stats.attendee?.totalTickets)} />
                <MetricCard label="Total spent" value={formatCurrency(stats.attendee?.totalSpent)} />
              </div>
            </section>

            <section className="analytics-section">
              <h2 className="analytics-section-title">
                <TrendingUp size={18} />
                Insights and charts
              </h2>
              <p className="analytics-section-desc">
                Visualize top event performance and your recent purchase behavior.
              </p>

              <div className="analytics-insights-grid">
                <article className="analytics-insight-card">
                  <span>Top event revenue</span>
                  <strong>
                    {topOrganizerEvents[0] ? formatCurrency(topOrganizerEvents[0].revenue) : formatCurrency(0)}
                  </strong>
                  <p>{topOrganizerEvents[0]?.name || "No organizer events yet"}</p>
                </article>
                <article className="analytics-insight-card">
                  <span>Recent attendee spend (8 periods)</span>
                  <strong>
                    {formatCurrency(attendeeSpendTrend.reduce((sum, point) => sum + Number(point.spent || 0), 0))}
                  </strong>
                  <p>Latest trend from your checkout history</p>
                </article>
                <article className="analytics-insight-card">
                  <span>Live event ratio</span>
                  <strong>
                    {stats.totalEvents
                      ? `${Math.round((Number(stats.currentlyLive || 0) / Number(stats.totalEvents || 1)) * 100)}%`
                      : "0%"}
                  </strong>
                  <p>Portion of your events currently active</p>
                </article>
              </div>

              <div className="analytics-charts-grid">
                <article className="analytics-chart-card">
                  <div className="analytics-chart-head">
                    <h3>Top events performance</h3>
                    <p>Views and tickets sold across your highest revenue events.</p>
                  </div>
                  <div className="analytics-chart-canvas">
                    {topOrganizerEvents.length ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={topOrganizerEvents}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(96,112,137,0.2)" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} />
                          <YAxis yAxisId="left" tickLine={false} axisLine={false} />
                          <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="views" name="Views" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="tickets"
                            name="Tickets sold"
                            stroke="#db2777"
                            strokeWidth={3}
                            dot={{ r: 3 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="analytics-empty">No organizer event data for chart yet.</div>
                    )}
                  </div>
                </article>

                <article className="analytics-chart-card">
                  <div className="analytics-chart-head">
                    <h3>Purchase trend</h3>
                    <p>Recent attendee spend and ticket quantities over time.</p>
                  </div>
                  <div className="analytics-chart-canvas">
                    {attendeeSpendTrend.length ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={attendeeSpendTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(96,112,137,0.2)" />
                          <XAxis dataKey="label" tickLine={false} axisLine={false} />
                          <YAxis yAxisId="left" tickLine={false} axisLine={false} />
                          <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} />
                          <Tooltip formatter={(value, name) => (name === "Spent" ? formatCurrency(value) : value)} />
                          <Legend />
                          <Bar yAxisId="left" dataKey="tickets" name="Tickets" fill="#6366f1" radius={[8, 8, 0, 0]} />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="spent"
                            name="Spent"
                            stroke="#0f766e"
                            strokeWidth={3}
                            dot={{ r: 3 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="analytics-empty">No attendee purchase trend data yet.</div>
                    )}
                  </div>
                </article>

                <article className="analytics-chart-card analytics-chart-card--donut">
                  <div className="analytics-chart-head">
                    <h3>Revenue vs spend split</h3>
                    <p>How your organizer revenue compares to attendee spend.</p>
                  </div>
                  <div className="analytics-chart-canvas">
                    {shareData.length ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={shareData}
                            cx="50%"
                            cy="50%"
                            innerRadius={68}
                            outerRadius={104}
                            paddingAngle={3}
                            dataKey="value"
                            nameKey="name"
                          >
                            {shareData.map((entry, index) => (
                              <Cell key={entry.name} fill={donutColors[index % donutColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="analytics-empty">No spend and revenue values to compare yet.</div>
                    )}
                  </div>
                </article>

                <article className="analytics-chart-card analytics-chart-card--trend">
                  <div className="analytics-chart-head">
                    <h3>Revenue &amp; sales trend</h3>
                    <p>Revenue and tickets sold for each event you created.</p>
                  </div>
                  <div className="analytics-chart-canvas">
                    {revenueSalesTrendData.length ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueSalesTrendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(96,112,137,0.2)" />
                          <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} angle={-28} textAnchor="end" height={72} />
                          <YAxis tickLine={false} axisLine={false} />
                          <Tooltip formatter={(value, name) => (name === "Revenue" ? formatCurrency(value) : value)} />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="ticketsSold" name="Tickets sold" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="analytics-empty">Create events and sell tickets to see this trend.</div>
                    )}
                  </div>
                </article>
              </div>
            </section>

            <section className="analytics-section">
              <h2 className="analytics-section-title">
                <Eye size={18} />
                Event-by-event tracking (events you created)
              </h2>
              <p className="analytics-section-desc">
                Open individual event analytics for conversion, views, and revenue timeline.
              </p>
              <div className="analytics-table-wrap">
                {organizerEvents.length === 0 ? (
                  <div className="analytics-empty">You have not created any events yet.</div>
                ) : (
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Views</th>
                        <th>Tickets Sold</th>
                        <th>Revenue</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizerEvents.map((event) => (
                        <tr key={event.id}>
                          <td data-label="Event">
                            <div className="analytics-event-cell">
                              <EventThumb event={event} />
                              <div>
                                <h4>{event.title}</h4>
                                <span>{formatEventDate(event.startDate)}</span>
                              </div>
                            </div>
                          </td>
                          <td data-label="Views">{formatFullNumber(event.viewCount)}</td>
                          <td data-label="Tickets Sold">{formatFullNumber(event.ticketsSold)}</td>
                          <td data-label="Revenue">{formatCurrency(event.revenue)}</td>
                          <td data-label="Actions">
                            <div className="analytics-actions">
                              <Link to={`/Eventdetail/${event.id}`} className="analytics-btn analytics-btn--ghost">
                                <ExternalLink size={14} />
                                Event page
                              </Link>
                              {canOrganize ? (
                                <Link
                                  to={`/events/${event.id}/analytics`}
                                  className="analytics-btn analytics-btn--primary"
                                >
                                  <BarChart3 size={14} />
                                  Event analytics
                                </Link>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="analytics-section">
              <h2 className="analytics-section-title">
                <Ticket size={18} />
                Per-event attendee tracking (events you bought)
              </h2>
              <p className="analytics-section-desc">
                Monitor purchases, quantities, and spend per event you attend.
              </p>
              <div className="analytics-table-wrap">
                {attendeeByEvent.length === 0 ? (
                  <div className="analytics-empty">No ticket purchases yet.</div>
                ) : (
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Purchases</th>
                        <th>Tickets</th>
                        <th>Amount Spent</th>
                        <th>Last Purchase</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendeeByEvent.map((row) => (
                        <tr key={row.event._id}>
                          <td data-label="Event">
                            <div className="analytics-event-cell">
                              <EventThumb event={row.event} />
                              <div>
                                <h4>{row.event.title}</h4>
                                <span>{row.event.location || row.event.eventType || "Event"}</span>
                              </div>
                            </div>
                          </td>
                          <td data-label="Purchases">{formatFullNumber(row.purchases)}</td>
                          <td data-label="Tickets">{formatFullNumber(row.tickets)}</td>
                          <td data-label="Amount Spent">{formatCurrency(row.spent)}</td>
                          <td data-label="Last Purchase">
                            <span>
                              <Calendar size={13} style={{ marginRight: 4, verticalAlign: "text-bottom" }} />
                              {formatEventDate(row.lastPurchaseAt)}
                            </span>
                          </td>
                          <td data-label="Actions">
                            <div className="analytics-actions">
                              <Link
                                to={`/Eventdetail/${row.event._id}`}
                                className="analytics-btn analytics-btn--ghost"
                              >
                                <ExternalLink size={14} />
                                Open event
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
