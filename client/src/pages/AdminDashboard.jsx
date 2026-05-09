import React, { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Users,
    Calendar,
    Ticket,
    DollarSign,
    TrendingUp,
    Activity,
    AlertCircle,
} from "lucide-react";
import adminService from "../services/adminService";
import { StatCard, LoadingSpinner, ErrorMessage } from "../components/AdminComponents";
import { formatCurrency, formatNumber } from "../utils/adminUtils";
import AdminLayout from "../components/AdminLayout";

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [revenue, setRevenue] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [statsRes, metricsRes, revenueRes] = await Promise.all([
                adminService.getPlatformStats(),
                adminService.getPlatformMetrics(),
                adminService.getRevenueAnalytics(),
            ]);

            setStats(statsRes.stats);
            setMetrics(metricsRes.metrics);
            setRevenue(revenueRes.data.daily || []);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError(err.response?.data?.message || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ["#f43f8e", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Platform Overview</h1>
                        <p className="text-slate-500 mt-2">Real-time platform analytics and metrics</p>
                    </div>
                    <button
                        onClick={fetchDashboardData}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-white text-sm font-semibold shadow-sm hover:from-pink-600 hover:to-purple-700 transition-colors disabled:opacity-50"
                    >
                        <Activity size={18} />
                        Refresh Data
                    </button>
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {loading ? (
                    <LoadingSpinner />
                ) : stats ? (
                    <>
                        {/* Key Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                icon={Users}
                                label="Total Users"
                                value={formatNumber(stats.users?.total || 0)}
                                trend={`${stats.users?.new || 0} new this month`}
                            />
                            <StatCard
                                icon={Calendar}
                                label="Total Events"
                                value={formatNumber(stats.events?.total || 0)}
                                trend={`${stats.events?.approved || 0} approved`}
                            />
                            <StatCard
                                icon={Ticket}
                                label="Tickets Sold"
                                value={formatNumber(stats.tickets?.total || 0)}
                                trend={`${stats.tickets?.thisMonth || 0} this month`}
                            />
                            <StatCard
                                icon={DollarSign}
                                label="Total Revenue"
                                value={formatCurrency(stats.revenue?.total || 0)}
                                trend={formatCurrency(stats.revenue?.thisMonth || 0) + " this month"}
                            />
                        </div>

                        {/* User & Event Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* User Statistics */}
                            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">User Statistics</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-600">Total Users</span>
                                        <span className="text-lg font-bold text-slate-900">
                                            {formatNumber(stats.users?.total || 0)}
                                        </span>
                                    </div>
                                    <div className="h-px bg-gray-200" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-600">Organizers</span>
                                        <span className="text-lg font-bold text-pink-600">
                                            {formatNumber(stats.users?.organizers || 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-600">Active (30d)</span>
                                        <span className="text-lg font-bold text-emerald-600">
                                            {formatNumber(stats.users?.active || 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-600">Suspended</span>
                                        <span className="text-lg font-bold text-orange-600">
                                            {formatNumber(stats.users?.suspended || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Event Statistics */}
                            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Event Statistics</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-600">Total Events</span>
                                        <span className="text-lg font-bold text-slate-900">
                                            {formatNumber(stats.events?.total || 0)}
                                        </span>
                                    </div>
                                    <div className="h-px bg-gray-200" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-600">Approved</span>
                                        <span className="text-lg font-bold text-pink-600">
                                            {formatNumber(stats.events?.approved || 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-600">Pending Review</span>
                                        <span className="text-lg font-bold text-yellow-600">
                                            {formatNumber(stats.events?.pending || 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-600">Currently Live</span>
                                        <span className="text-lg font-bold text-red-600">
                                            {formatNumber(stats.events?.live || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Revenue Summary */}
                            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Summary</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-600">All-Time Revenue</span>
                                        <span className="text-lg font-bold text-slate-900">
                                            {formatCurrency(stats.revenue?.total || 0)}
                                        </span>
                                    </div>
                                    <div className="h-px bg-gray-200" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-600">This Month</span>
                                        <span className="text-lg font-bold text-pink-600">
                                            {formatCurrency(stats.revenue?.thisMonth || 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-600">Avg per Event</span>
                                        <span className="text-lg font-bold text-emerald-600">
                                            {formatCurrency(
                                                (stats.revenue?.total || 0) / Math.max(stats.events?.total || 1, 1),
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Revenue Trend */}
                            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-pink-500" />
                                    Revenue Trend (Last 30 Days)
                                </h3>
                                {revenue.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={revenue}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="_id" stroke="#9ca3af" />
                                            <YAxis stroke="#9ca3af" />
                                            <Tooltip
                                                formatter={(value) => formatCurrency(value)}
                                                contentStyle={{
                                                    backgroundColor: "#ffffff",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "8px",
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#f43f8e"
                                                strokeWidth={2}
                                                dot={{ fill: "#f43f8e", r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center py-12 text-slate-500">
                                        <AlertCircle size={20} className="mr-2" />
                                        No data available
                                    </div>
                                )}
                            </div>

                            {/* User Growth */}
                            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <Users size={20} className="text-pink-500" />
                                    User Growth (Last 30 Days)
                                </h3>
                                {metrics?.userGrowth && metrics.userGrowth.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={metrics.userGrowth}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="_id" stroke="#9ca3af" />
                                            <YAxis stroke="#9ca3af" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "#ffffff",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "8px",
                                                }}
                                            />
                                            <Bar dataKey="count" fill="#f43f8e" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center py-12 text-slate-500">
                                        <AlertCircle size={20} className="mr-2" />
                                        No data available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <a
                                    href="/admin/events"
                                    className="block px-4 py-3 bg-pink-50 border border-pink-200 rounded-2xl text-pink-700 hover:bg-pink-100 transition-colors text-sm font-medium text-center"
                                >
                                    📋 Review Pending Events ({stats.events?.pending || 0})
                                </a>
                                <a
                                    href="/admin/users"
                                    className="block px-4 py-3 bg-slate-50 border border-gray-200 rounded-2xl text-slate-700 hover:bg-gray-100 transition-colors text-sm font-medium text-center"
                                >
                                    👥 Manage Users ({stats.users?.total || 0})
                                </a>
                                <a
                                    href="/admin/transactions"
                                    className="block px-4 py-3 bg-slate-50 border border-gray-200 rounded-2xl text-slate-700 hover:bg-gray-100 transition-colors text-sm font-medium text-center"
                                >
                                    💳 View Transactions
                                </a>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
