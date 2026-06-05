import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Activity,
    AlertTriangle,
    Calendar,
    DollarSign,
    MessageSquare,
    Settings2,
    ShieldAlert,
    ShieldCheck,
    Star,
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

    function ModuleCard({ to, Icon, title, subtitle, details }) {
        return (
            <SurfaceCard className="group transition hover:-translate-y-0.5 hover:shadow-xl">
                <Link to={to} className="flex h-full flex-col justify-between gap-4 p-3 text-left">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{title}</p>
                            <p className="mt-3 text-sm font-semibold text-gray-900">{subtitle}</p>
                        </div>
                        {Icon ? (
                            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 transition duration-200 group-hover:bg-pink-100">
                                <Icon size={20} />
                            </div>
                        ) : null}
                    </div>
                    {details ? <p className="text-sm text-gray-500">{details}</p> : null}
                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">
                        Open module
                        <Star size={14} />
                    </span>
                </Link>
            </SurfaceCard>
        );
    }

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
            <div className="space-y-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900">Platform Overview</h2>
                        <p className="mt-1 text-xs text-gray-500">A live snapshot of growth, moderation queues, and money movement.</p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchDashboardData}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50"
                    >
                        <Activity size={16} />
                        Refresh data
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <ModuleCard
                        to="/admin/users"
                        Icon={Users}
                        title="User Management"
                        subtitle="Manage all users, organizers, subscribers, donors, and suspended accounts."
                        details={`Total ${formatNumber(stats?.users?.total || 0)} · Organizers ${formatNumber(stats?.users?.organizers || 0)} · Suspended ${formatNumber(stats?.users?.suspended || 0)}`}
                    />
                    <ModuleCard
                        to="/admin/users"
                        Icon={ShieldCheck}
                        title="Verification Management"
                        subtitle="Approve and reject verification requests, review organizer documents."
                        details={`Verified organizers ${formatNumber(stats?.users?.verifiedOrganizers || 0)} · Pending review in user profiles`}
                    />
                    <ModuleCard
                        to="/admin/events"
                        Icon={Calendar}
                        title="Event Management"
                        subtitle="Review public/private events, flagged or featured listings, and cancellations."
                        details={`Approved ${formatNumber(stats?.events?.approved || 0)} · Private ${formatNumber(stats?.events?.private || 0)} · Featured ${formatNumber(stats?.events?.featured || 0)}`}
                    />
                    <ModuleCard
                        to="/admin/finance"
                        Icon={DollarSign}
                        title="Payment Management"
                        subtitle="Track revenue, commissions, escrow balances, and payout liabilities."
                        details={`Revenue ${formatCurrency(stats?.revenue?.total || 0)} · Subscription ${formatCurrency(stats?.revenue?.subscriptionRevenue || 0)}`}
                    />
                    <ModuleCard
                        to="/admin/moderation"
                        Icon={ShieldAlert}
                        title="Fraud Management"
                        subtitle="Investigate suspicious transactions, organizers, and chargeback alerts."
                        details={`Pending issues, event risk, and payout flags available in moderation.`}
                    />
                    <ModuleCard
                        to="/admin/moderation"
                        Icon={AlertTriangle}
                        title="Review Moderation"
                        subtitle="Moderate reviews, reports, complaints, and community feedback."
                        details="Use the moderation queue to resolve reputation issues and support cases."
                    />
                    <ModuleCard
                        to="/admin/moderation"
                        Icon={MessageSquare}
                        title="Support Management"
                        subtitle="Resolve support tickets, complaints and reports from customers and organizers."
                        details="Route issues to support, escalate disputes, and monitor complaint status."
                    />
                    <ModuleCard
                        to="/analytics"
                        Icon={TrendingUp}
                        title="Analytics Center"
                        subtitle="See platform-wide users, events, ticket sales, subscriptions, donations, and referrals."
                        details="Deep dive into growth, engagement, conversion, and performance metrics."
                    />
                    <ModuleCard
                        to="/admin/settings"
                        Icon={Settings2}
                        title="System Settings"
                        subtitle="Adjust commission, withdrawal, escrow, verification, referral, and homepage rules."
                        details="Configure platform policies and publish announcements from one place."
                    />
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
                                detail={`${formatNumber(stats.events?.pending || 0)} pending, ${formatNumber(stats.events?.suspended || 0)} suspended`}
                            />
                            <StatCard
                                icon={Ticket}
                                label="Tickets Sold"
                                value={formatNumber(stats.tickets?.total || 0)}
                                detail={`${formatNumber(stats.tickets?.checkedIn || 0)} checked in`}
                            />
                            <StatCard
                                icon={DollarSign}
                                label="Revenue"
                                value={formatCurrency(stats.revenue?.total || 0)}
                                detail={`${formatCurrency(stats.revenue?.organizerRevenue || 0)} to organizers`}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                icon={ShieldCheck}
                                label="Pending Verifications"
                                value={formatNumber(stats.verification?.pendingRequests || 0)}
                                detail="Organizer verification queue"
                            />
                            <StatCard
                                icon={ShieldAlert}
                                label="Fraud Alerts"
                                value={formatNumber(stats.fraud?.unresolvedAlerts || 0)}
                                detail="Active risk signals"
                            />
                            <StatCard
                                icon={MessageSquare}
                                label="Open Support Tickets"
                                value={formatNumber(stats.support?.openTickets || 0)}
                                detail="Customer and organizer issues"
                            />
                            <StatCard
                                icon={AlertTriangle}
                                label="Pending Reports"
                                value={formatNumber(stats.reports?.pending || 0)}
                                detail={`${formatNumber(stats.reports?.flaggedEvents || 0)} flagged events`}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                icon={Users}
                                label="Organizers"
                                value={formatNumber(stats.users?.organizers || 0)}
                                detail={`${formatNumber(stats.users?.verifiedOrganizers || 0)} verified`}
                            />
                            <StatCard
                                icon={Calendar}
                                label="Featured Events"
                                value={formatNumber(stats.events?.featured || 0)}
                                detail={`${formatNumber(stats.events?.approved || 0)} approved`}
                            />
                            <StatCard
                                icon={TrendingUp}
                                label="Live Events"
                                value={formatNumber(stats.events?.live || 0)}
                                detail={`${formatNumber(stats.events?.rejected || 0)} rejected`}
                            />
                            <StatCard
                                icon={Wallet}
                                label="Donations"
                                value={formatCurrency(stats.revenue?.donations || 0)}
                                detail={`${formatNumber(stats.revenue?.donationCount || 0)} donations`}
                            />
                        </div>

                        <div className="grid gap-5 xl:grid-cols-2">
                            <SurfaceCard>
                                <div className="mb-4 flex items-center gap-2">
                                    <TrendingUp className="text-pink-500" size={18} />
                                    <h3 className="text-sm font-extrabold text-gray-900">Revenue Trend</h3>
                                </div>
                                {revenue.length ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <LineChart data={revenue}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} />
                                            <YAxis stroke="#94a3b8" fontSize={12} />
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Line type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState title="No revenue data yet" description="Revenue analytics will appear here once ticket sales begin." />
                                )}
                            </SurfaceCard>

                            <SurfaceCard>
                                <div className="mb-4 flex items-center gap-2">
                                    <Users className="text-pink-500" size={18} />
                                    <h3 className="text-sm font-extrabold text-gray-900">User Growth</h3>
                                </div>
                                {metrics?.userGrowth?.length ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={metrics.userGrowth}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} />
                                            <YAxis stroke="#94a3b8" fontSize={12} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#ec4899" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState title="No growth data yet" description="User growth will populate after new signups are recorded." />
                                )}
                            </SurfaceCard>
                        </div>

                        <div className="grid gap-5 xl:grid-cols-3">
                            <SurfaceCard className="space-y-3">
                                <h3 className="text-sm font-extrabold text-gray-900">Recent Transactions</h3>
                                {(stats.recentTransactions || []).slice(0, 5).map((transaction) => (
                                    <div key={transaction._id} className="rounded-xl border border-gray-200 p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{transaction.event?.title || "Unknown event"}</p>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {transaction.buyer?.name || transaction.buyer?.username || "Unknown buyer"}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-900">{formatCurrency(transaction.amount || 0)}</p>
                                                <StatusBadge tone={getStatusTone(transaction.paymentStatus === "paid" ? "success" : transaction.paymentStatus)}>
                                                    {transaction.paymentStatus === "paid" ? "success" : transaction.paymentStatus}
                                                </StatusBadge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {!stats.recentTransactions?.length ? <p className="text-xs text-gray-500">No recent transactions.</p> : null}
                            </SurfaceCard>

                            <SurfaceCard className="space-y-3">
                                <h3 className="text-sm font-extrabold text-gray-900">Recent Withdrawals</h3>
                                {(stats.recentWithdrawals || []).slice(0, 5).map((withdrawal) => (
                                    <div key={withdrawal._id} className="rounded-xl border border-gray-200 p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {withdrawal.organizer?.name || withdrawal.organizer?.username || "Unknown organizer"}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500">{formatDateTime(withdrawal.createdAt)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-900">{formatCurrency(withdrawal.amount || 0)}</p>
                                                <StatusBadge tone={getStatusTone(withdrawal.status)}>{withdrawal.status}</StatusBadge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {!stats.recentWithdrawals?.length ? <p className="text-xs text-gray-500">No recent withdrawals.</p> : null}
                            </SurfaceCard>

                            <SurfaceCard className="space-y-3">
                                <h3 className="text-sm font-extrabold text-gray-900">Admin Activity</h3>
                                {(stats.recentActivities || []).slice(0, 6).map((activity) => (
                                    <div key={activity._id} className="rounded-xl border border-gray-200 p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{activity.action.replace(/_/g, " ")}</p>
                                                <p className="mt-0.5 text-xs text-gray-500">{activity.adminId?.name || activity.adminId?.email || "Unknown admin"}</p>
                                            </div>
                                            <p className="text-xs text-gray-500">{formatDateTime(activity.createdAt)}</p>
                                        </div>
                                        {activity.details ? <p className="mt-2 text-xs text-gray-600">{activity.details}</p> : null}
                                    </div>
                                ))}
                                {!stats.recentActivities?.length ? <p className="text-xs text-gray-500">No admin activity logged yet.</p> : null}
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