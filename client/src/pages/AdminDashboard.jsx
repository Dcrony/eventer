import { useEffect, useState } from "react";
import {
    Activity,
    Calendar,
    DollarSign,
    Ticket,
    TrendingUp,
    Users,
    Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AdminLayout from "../components/AdminLayout";
import {
    EmptyState,
    ErrorMessage,
    LoadingSpinner,
    StatCard,
    StatusBadge,
    SurfaceCard,
} from "../components/AdminComponents";
import adminService from "../services/adminService";
import { formatCurrency, formatDateTime, formatNumber, getStatusTone } from "../utils/adminUtils";

export default function AdminDashboard() {
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
            setRevenue(revenueRes.data?.daily || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Dashboard Analytics" description="Monitor users, events, revenue, admin actions, and payout activity across TickiSpot.">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-950">Platform Overview</h2>
                        <p className="mt-2 text-sm text-slate-500">A live snapshot of growth, moderation queues, and money movement.</p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchDashboardData}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:opacity-50"
                    >
                        <Activity size={18} />
                        Refresh data
                    </button>
                </div>

                {error ? <ErrorMessage message={error} onDismiss={() => setError(null)} /> : null}

                {loading ? (
                    <LoadingSpinner label="Loading dashboard analytics..." />
                ) : stats ? (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                icon={Users}
                                label="Total Users"
                                value={formatNumber(stats.users?.total || 0)}
                                detail={`${formatNumber(stats.users?.active || 0)} active, ${formatNumber(stats.users?.suspended || 0)} suspended`}
                            />
                            <StatCard
                                icon={Calendar}
                                label="Events"
                                value={formatNumber(stats.events?.total || 0)}
                                detail={`${formatNumber(stats.events?.pending || 0)} pending review`}
                            />
                            <StatCard
                                icon={Ticket}
                                label="Tickets Sold"
                                value={formatNumber(stats.tickets?.total || 0)}
                                detail={`${formatNumber(stats.tickets?.thisMonth || 0)} sold this month`}
                            />
                            <StatCard
                                icon={DollarSign}
                                label="Revenue"
                                value={formatCurrency(stats.revenue?.total || 0)}
                                detail={`${formatCurrency(stats.revenue?.thisMonth || 0)} this month`}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                icon={Users}
                                label="Organizers"
                                value={formatNumber(stats.users?.organizers || 0)}
                                detail={`${formatNumber(stats.users?.new || 0)} new users in 30 days`}
                            />
                            <StatCard
                                icon={Calendar}
                                label="Approved Events"
                                value={formatNumber(stats.events?.approved || 0)}
                                detail={`${formatNumber(stats.events?.featured || 0)} featured`}
                            />
                            <StatCard
                                icon={TrendingUp}
                                label="Live Events"
                                value={formatNumber(stats.events?.live || 0)}
                                detail={`${formatNumber(stats.events?.rejected || 0)} rejected`}
                            />
                            <StatCard
                                icon={Wallet}
                                label="Recent Withdrawals"
                                value={formatNumber(stats.recentWithdrawals?.length || 0)}
                                detail="Latest payout requests"
                            />
                        </div>

                        <div className="grid gap-6 xl:grid-cols-2">
                            <SurfaceCard>
                                <div className="mb-4 flex items-center gap-2">
                                    <TrendingUp className="text-pink-500" size={20} />
                                    <h3 className="text-lg font-semibold text-slate-950">Revenue Trend</h3>
                                </div>
                                {revenue.length ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={revenue}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="_id" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Line type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={3} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState title="No revenue data yet" description="Revenue analytics will appear here once ticket sales begin." />
                                )}
                            </SurfaceCard>

                            <SurfaceCard>
                                <div className="mb-4 flex items-center gap-2">
                                    <Users className="text-pink-500" size={20} />
                                    <h3 className="text-lg font-semibold text-slate-950">User Growth</h3>
                                </div>
                                {metrics?.userGrowth?.length ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={metrics.userGrowth}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="_id" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#ec4899" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState title="No growth data yet" description="User growth will populate after new signups are recorded." />
                                )}
                            </SurfaceCard>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-3">
                            <SurfaceCard className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-950">Recent Transactions</h3>
                                {(stats.recentTransactions || []).slice(0, 5).map((transaction) => (
                                    <div key={transaction._id} className="rounded-2xl border border-slate-200 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{transaction.event?.title || "Unknown event"}</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {transaction.buyer?.name || transaction.buyer?.username || "Unknown buyer"}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-slate-900">{formatCurrency(transaction.amount || 0)}</p>
                                                <StatusBadge tone={getStatusTone(transaction.paymentStatus === "paid" ? "success" : transaction.paymentStatus)}>
                                                    {transaction.paymentStatus === "paid" ? "success" : transaction.paymentStatus}
                                                </StatusBadge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {!stats.recentTransactions?.length ? <p className="text-sm text-slate-500">No recent transactions.</p> : null}
                            </SurfaceCard>

                            <SurfaceCard className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-950">Recent Withdrawals</h3>
                                {(stats.recentWithdrawals || []).slice(0, 5).map((withdrawal) => (
                                    <div key={withdrawal._id} className="rounded-2xl border border-slate-200 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {withdrawal.organizer?.name || withdrawal.organizer?.username || "Unknown organizer"}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">{formatDateTime(withdrawal.createdAt)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-slate-900">{formatCurrency(withdrawal.amount || 0)}</p>
                                                <StatusBadge tone={getStatusTone(withdrawal.status)}>{withdrawal.status}</StatusBadge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {!stats.recentWithdrawals?.length ? <p className="text-sm text-slate-500">No recent withdrawals.</p> : null}
                            </SurfaceCard>

                            <SurfaceCard className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-950">Admin Activity</h3>
                                {(stats.recentActivities || []).slice(0, 6).map((activity) => (
                                    <div key={activity._id} className="rounded-2xl border border-slate-200 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{activity.action.replace(/_/g, " ")}</p>
                                                <p className="mt-1 text-xs text-slate-500">{activity.adminId?.name || activity.adminId?.email || "Unknown admin"}</p>
                                            </div>
                                            <p className="text-xs text-slate-500">{formatDateTime(activity.createdAt)}</p>
                                        </div>
                                        {activity.details ? <p className="mt-2 text-sm text-slate-600">{activity.details}</p> : null}
                                    </div>
                                ))}
                                {!stats.recentActivities?.length ? <p className="text-sm text-slate-500">No admin activity logged yet.</p> : null}
                            </SurfaceCard>
                        </div>
                    </>
                ) : (
                    <EmptyState title="No analytics available" description="Dashboard data could not be loaded yet." />
                )}
            </div>
        </AdminLayout>
    );
}
