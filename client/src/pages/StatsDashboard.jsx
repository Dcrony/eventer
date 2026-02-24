import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import { jwtDecode } from "jwt-decode";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import "./CSS/Stats.css";
import { BarChart3, LayoutDashboard, Radio, ShoppingCart, Ticket, User, UserCheck, UserCog } from "lucide-react";

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const token = useMemo(() => localStorage.getItem("token"), []);

  // 🔐 Check admin
  useEffect(() => {
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      setIsAdmin(!!decoded.isAdmin);
    } catch {
      setIsAdmin(false);
    }
  }, [token]);

  // 📊 Fetch stats
  useEffect(() => {
    setLoading(true);
    setError(null);

    API.get("/stats/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load statistics. Please try again.");
        setLoading(false);
      });
  }, [token]);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className={`stat-tile ${color}`}>
      <div className="stat-tile-content">
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
      </div>
      <div className="stat-tile-icon-wrapper">
        <Icon size={24} className="stat-tile-icon" />
      </div>
    </div>
  );

  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return "0";
    return new Intl.NumberFormat("en-NG").format(num);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <div className="dashboard-title">Statistics Overview</div>
            <div className="dashboard-subtitle">
              Track performance, revenue, and event engagement.
            </div>
          </div>

          {isAdmin && (
            <div className="dashboard-actions">
              <Link to="/admin/users" className="dash-btn">
                Manage Users
              </Link>

              <Link to="/admin/withdrawals"
              className="dash-btn dash-btn-primary"
              
            >
              Withdraw Management
            </Link>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="dash-card">
            <div className="dash-card-body">Loading statistics…</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="dash-card">
            <div className="dash-card-body">
              <p style={{ color: "#dc2626", fontWeight: 800 }}>{error}</p>
              <button
                className="dash-btn"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        {!loading && !error && stats && (
          <>
            {/* Core Stats */}
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-title">Key Metrics</div>
              </div>
              <div className="dash-card-body">
                <div className="stats-container-grid">
                  <StatCard
                    title="Total Events"
                    value={stats.totalEvents}
                    icon={LayoutDashboard}
                    color="blue"
                  />
                  <StatCard
                    title="Tickets Sold"
                    value={formatNumber(stats.totalTicketsSold)}
                    icon={Ticket}
                    color="pink"
                  />
                  <StatCard
                    title="Revenue"
                    value={`₦${formatNumber(stats.totalRevenue)}`}
                    icon={BarChart3}
                    color="green"
                  />
                  <StatCard
                    title="Live Sessions"
                    value={stats.currentlyLive}
                    icon={Radio}
                    color="red"
                  />
                </div>
              </div>
            </div>

            {/* Admin Stats */}
            {isAdmin && (
              <div className="dash-card" style={{ marginTop: "1rem" }}>
                <div className="dash-card-header">
                  <div className="dash-card-title">Platform Stats</div>
                </div>
                <div className="dash-card-body">
                  <div className="stats-container-grid">
                    <StatCard
                      title="Total Users"
                      value={stats.totalUsers}
                      icon={User}
                      color="blue"
                    />
                    <StatCard
                      title="Active Users"
                      value={stats.activeUsers}
                      icon={UserCheck}
                      color="green"
                    />
                    <StatCard
                      title="Organizers"
                      value={stats.organizers}
                      icon={UserCog}
                      color="pink"
                    />
                    <StatCard
                      title="Buyers"
                      value={stats.buyers}
                      icon={ShoppingCart}
                      color="red"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Charts */}
            <div className="charts-grid">
              <div className="dash-card">
                <div className="dash-card-header">
                  <div className="dash-card-title">Tickets Sold per Event</div>
                </div>
                <div className="dash-card-body chart-box">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.perEventStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="title" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ticketsSold" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="dash-card">
                <div className="dash-card-header">
                  <div className="dash-card-title">Revenue Distribution</div>
                </div>
                <div className="dash-card-body chart-box">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={stats.perEventStats}
                        dataKey="revenue"
                        nameKey="title"
                        outerRadius={90}
                        label
                      >
                        {stats.perEventStats.map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              ["#ec4899", "#4f46e5", "#10b981", "#f59e0b"][
                                i % 4
                              ]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Trend */}
            <div className="dash-card" style={{ marginTop: "1rem" }}>
              <div className="dash-card-header">
                <div className="dash-card-title">Revenue & Sales Trend</div>
              </div>
              <div className="dash-card-body chart-box">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={stats.perEventStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="revenue" />
                    <Line dataKey="ticketsSold" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
