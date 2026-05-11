import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Calendar, ExternalLink, Eye, Ticket, TrendingUp, Wallet, Lock } from "lucide-react";
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
import "./CSS/Analytics.css";

function MetricCard({ label, value, isBlurred = false, onUpgrade }) {
  return (
    <article className={`analytics-metric ${isBlurred ? "blurred-metric" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {isBlurred && (
        <div className="blur-overlay" onClick={onUpgrade}>
          <Lock size={20} />
          <span>Pro Feature</span>
          <button className="upgrade-link">Upgrade to unlock</button>
        </div>
      )}
    </article>
  );
}

function EventThumb({ event }) {
  const url = getEventImageUrl(event);
  if (url) {
    return <img src={url} alt={event.title} className="analytics-event-thumb" />;
  }
  return <div className="analytics-event-thumb analytics-event-thumb--placeholder">EVENT</div>;
}

export default function PlatformAnalytics() {
  const user = getCurrentUser();
  const { hasAccess: hasFullAccess, promptUpgrade: promptUpgradeAnalytics } = useFeatureAccess("analytics"); // Returns true for Pro or active trial

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canOrganize = user?.role === "organizer" || user?.isOrganizer === true || user?.role === "admin";

  // Fetch full analytics only if user has access
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

  // Basic fallback data for Free users
  const basicStats = {
    totalEvents: stats?.totalEvents || 0,
    totalViews: stats?.totalViews || 1240,
    totalTicketsSold: stats?.totalTicketsSold || 0,
  };

  const organizerEvents = stats?.perEventStats || [];
  const attendeePurchases = stats?.attendee?.recentPurchases || [];

  // ==================== COMPUTED VALUES ====================
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
    <div className="dashboard-page dashboard-page">
      <div className="dashboard-container">
        <header className="analytics-hero">
          <span className="analytics-hero-eyebrow">
            <BarChart3 size={14} />
            ANALYTICS
          </span>
          <h1>Platform Analytics</h1>
          <p>Track your events performance, revenue, and attendee behavior.</p>
        </header>

        {!hasFullAccess && (
          <div className="pro-teaser-banner">
            <Lock size={22} />
            <div>
              <strong>Upgrade to Pro for full analytics</strong>
              <p>Unlock revenue insights, charts, conversion rates, and detailed reports.</p>
            </div>
            <button onClick={promptUpgradeAnalytics} className="upgrade-btn">
              Upgrade to Pro
            </button>
          </div>
        )}

        {loading && <div className="glass-panel analytics-state">Loading analytics...</div>}
        {error && <div className="glass-panel analytics-state is-error">{error}</div>}

        {/* Overview Metrics */}
        <section className="analytics-section">
          <h2 className="analytics-section-title">
            <Wallet size={18} /> Overview
          </h2>

          <div className="analytics-metrics">
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
        <section className="analytics-section">
          <h2 className="analytics-section-title">
            <TrendingUp size={18} /> Insights & Charts
          </h2>

          {!hasFullAccess ? (
            <div className="blurred-charts-container">
              <div className="blur-overlay center">
                <Lock size={32} />
                <h3>Advanced Charts & Insights</h3>
                <p>Revenue trends, performance comparison, and attendee behavior are Pro features.</p>
                <button onClick={promptUpgradeAnalytics} className="upgrade-btn large">
                  Unlock with Pro
                </button>
              </div>
            </div>
          ) : (
            <div className="analytics-charts-grid">
              {/* Top Events Performance */}
              <article className="analytics-chart-card">
                <div className="analytics-chart-head">
                  <h3>Top Events Performance</h3>
                  <p>Views vs Tickets Sold</p>
                </div>
                <div className="analytics-chart-canvas">
                  {topOrganizerEvents.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={topOrganizerEvents}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="views" name="Views" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                        <Line yAxisId="right" dataKey="tickets" name="Tickets Sold" stroke="#ec4899" strokeWidth={3} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="analytics-empty">No event data yet.</div>
                  )}
                </div>
              </article>

              {/* Purchase Trend */}
              <article className="analytics-chart-card">
                <div className="analytics-chart-head">
                  <h3>Purchase Trend</h3>
                  <p>Recent attendee activity</p>
                </div>
                <div className="analytics-chart-canvas">
                  {attendeeSpendTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={attendeeSpendTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} />
                        <Tooltip formatter={(value, name) => (name === "Spent" ? formatCurrency(value) : value)} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="tickets" name="Tickets" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        <Line yAxisId="right" dataKey="spent" name="Spent" stroke="#0f766e" strokeWidth={3} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="analytics-empty">No purchase data yet.</div>
                  )}
                </div>
              </article>

              {/* Revenue Split */}
              <article className="analytics-chart-card analytics-chart-card--donut">
                <div className="analytics-chart-head">
                  <h3>Revenue vs Spend Split</h3>
                </div>
                <div className="analytics-chart-canvas">
                  {shareData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={shareData}
                          cx="50%"
                          cy="50%"
                          innerRadius={68}
                          outerRadius={104}
                          dataKey="value"
                          nameKey="name"
                        >
                          {shareData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="analytics-empty">No data to display yet.</div>
                  )}
                </div>
              </article>
            </div>
          )}
        </section>

        {/* Events Table - Blurred for Free Users */}
        <section className="analytics-section">
          <h2 className="analytics-section-title">
            <Eye size={18} /> Your Events Performance
          </h2>

          {!hasFullAccess ? (
            <div className="blurred-table">
              <div className="blur-overlay">
                <Lock size={28} />
                <p>Detailed per-event analytics and revenue tracking are available on Pro.</p>
                <button onClick={promptUpgradeAnalytics} className="upgrade-btn">
                  Upgrade to Pro
                </button>
              </div>
              <table className="analytics-table blurred">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Views</th>
                    <th>Tickets</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td>Sample Event {i + 1}</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Full Table for Pro Users */
            <div className="analytics-table-wrap">
              {organizerEvents.length === 0 ? (
                <div className="analytics-empty">You haven't created any events yet.</div>
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
                        <td>
                          <div className="analytics-event-cell">
                            <EventThumb event={event} />
                            <div>
                              <h4>{event.title}</h4>
                              <span>{formatEventDate(event.startDate)}</span>
                            </div>
                          </div>
                        </td>
                        <td>{formatFullNumber(event.viewCount)}</td>
                        <td>{formatFullNumber(event.ticketsSold)}</td>
                        <td>{formatCurrency(event.revenue)}</td>
                        <td>
                          <div className="analytics-actions">
                            <Link to={`/event/${event.id}`} className="analytics-btn analytics-btn--ghost">
                              <ExternalLink size={14} /> View
                            </Link>
                            {canOrganize && (
                              <Link to={`/events/${event.id}/analytics`} className="analytics-btn analytics-btn--primary">
                                <BarChart3 size={14} /> Details
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}