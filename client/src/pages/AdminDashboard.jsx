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
    ArrowUpRight,
    RefreshCcw,
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

function ModuleCard({ to, Icon, title, subtitle, details }) {
    return (
        <Link
            to={to}
            className="group flex flex-col justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-pink-100 hover:shadow-sm"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-500 transition-colors group-hover:bg-pink-100">
                    <Icon size={17} />
                </div>
                <ArrowUpRight size={14} className="text-gray-300 transition-colors group-hover:text-pink-400" />
            </div>
            <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">{title}</p>
                <p className="mt-1 text-xs font-semibold text-gray-800 leading-snug">{subtitle}</p>
                {details && <p className="mt-1.5 text-[0.6rem] text-gray-400 leading-relaxed">{details}</p>}
            </div>
            <span className="text-[0.6rem] font-bold uppercase tracking-widest text-pink-500">
                Open module →
            </span>
        </Link>
    );
}

const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-xs font-semibold text-gray-900">
                    {formatter ? formatter(p.value) : p.value}
                </p>
            ))}
        </div>
    );
};

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [revenue, setRevenue] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => { fetchDashboardData(); }, []);

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
        <AdminLayout
            title="Dashboard Analytics"
            description="Monitor users, events, revenue, admin actions, and payout activity across TickiSpot."
        >
            <div className="space-y-4">
                {/* Header row */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Platform Overview</h2>
                        <p className="mt-0.5 text-xs text-gray-400">Live snapshot of growth, queues, and money movement.</p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchDashboardData}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-pink-600 disabled:opacity-50"
                    >
                        <RefreshCcw size={13} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                {/* Module cards */}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <ModuleCard to="/admin/users" Icon={Users} title="User Management" subtitle="Manage users, organizers, and suspended accounts." details={`Total ${formatNumber(stats?.users?.total || 0)} · Organizers ${formatNumber(stats?.users?.organizers || 0)} · Suspended ${formatNumber(stats?.users?.suspended || 0)}`} />
                    <ModuleCard to="/admin/verification" Icon={ShieldCheck} title="Verification" subtitle="Approve and reject organizer verification requests." details={`Verified ${formatNumber(stats?.users?.verifiedOrganizers || 0)} · Pending review in queue`} />
                    <ModuleCard to="/admin/events" Icon={Calendar} title="Event Management" subtitle="Review events, featured listings, and cancellations." details={`Approved ${formatNumber(stats?.events?.approved || 0)} · Featured ${formatNumber(stats?.events?.featured || 0)}`} />
                    <ModuleCard to="/admin/finance" Icon={DollarSign} title="Finance" subtitle="Track revenue, commissions, escrow, and liabilities." details={`Revenue ${formatCurrency(stats?.revenue?.total || 0)} · Subscriptions ${formatCurrency(stats?.revenue?.subscriptionRevenue || 0)}`} />
                    <ModuleCard to="/admin/moderation" Icon={ShieldAlert} title="Moderation & Risk" subtitle="Investigate suspicious transactions and chargeback alerts." details="Pending issues, event risk, and payout flags." />
                    <ModuleCard to="/admin/moderation" Icon={AlertTriangle} title="Review Moderation" subtitle="Moderate reviews, reports, and community feedback." details="Resolve reputation issues and support cases." />
                    <ModuleCard to="/admin/payouts" Icon={Wallet} title="Payout Management" subtitle="Release escrow, freeze funds, and manage organizer payouts." details="Review pending payouts and take action." />
                    <ModuleCard to="/admin/controls" Icon={MessageSquare} title="Operations" subtitle="Send announcements and run global search." details="Route issues, escalate disputes, and monitor complaints." />
                    <ModuleCard to="/admin/settings" Icon={Settings2} title="System Settings" subtitle="Commission, escrow, verification, and homepage rules." details="Configure platform policies from one place." />
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {loading ? (
                    <LoadingSpinner label="Loading dashboard analytics..." />
                ) : stats ? (
                    <>
                        {/* Primary stats */}
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard icon={Users} label="Total Users" value={formatNumber(stats.users?.total || 0)} detail={`${formatNumber(stats.users?.active || 0)} active · ${formatNumber(stats.users?.suspended || 0)} suspended`} accent />
                            <StatCard icon={Calendar} label="Events" value={formatNumber(stats.events?.total || 0)} detail={`${formatNumber(stats.events?.pending || 0)} pending · ${formatNumber(stats.events?.suspended || 0)} suspended`} />
                            <StatCard icon={Ticket} label="Tickets Sold" value={formatNumber(stats.tickets?.total || 0)} detail={`${formatNumber(stats.tickets?.checkedIn || 0)} checked in`} />
                            <StatCard icon={DollarSign} label="Revenue" value={formatCurrency(stats.revenue?.total || 0)} detail={`${formatCurrency(stats.revenue?.organizerRevenue || 0)} to organizers`} accent />
                        </div>

                        {/* Alert stats */}
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard icon={ShieldCheck} label="Pending Verifications" value={formatNumber(stats.verification?.pendingRequests || 0)} detail="Organizer verification queue" />
                            <StatCard icon={ShieldAlert} label="Fraud Alerts" value={formatNumber(stats.fraud?.unresolvedAlerts || 0)} detail="Active risk signals" />
                            <StatCard icon={MessageSquare} label="Open Support Tickets" value={formatNumber(stats.support?.openTickets || 0)} detail="Customer and organizer issues" />
                            <StatCard icon={AlertTriangle} label="Pending Reports" value={formatNumber(stats.reports?.pending || 0)} detail={`${formatNumber(stats.reports?.flaggedEvents || 0)} flagged events`} />
                        </div>

                        {/* Secondary stats */}
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard icon={Users} label="Organizers" value={formatNumber(stats.users?.organizers || 0)} detail={`${formatNumber(stats.users?.verifiedOrganizers || 0)} verified`} />
                            <StatCard icon={Star} label="Featured Events" value={formatNumber(stats.events?.featured || 0)} detail={`${formatNumber(stats.events?.approved || 0)} approved`} />
                            <StatCard icon={Activity} label="Live Events" value={formatNumber(stats.events?.live || 0)} detail={`${formatNumber(stats.events?.rejected || 0)} rejected`} />
                            <StatCard icon={Wallet} label="Donations" value={formatCurrency(stats.revenue?.donations || 0)} detail={`${formatNumber(stats.revenue?.donationCount || 0)} donations`} />
                        </div>

                        {/* Charts */}
                        <div className="grid gap-4 xl:grid-cols-2">
                            <SurfaceCard>
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50">
                                        <TrendingUp size={14} className="text-pink-500" />
                                    </div>
                                    <h3 className="text-xs font-bold text-gray-900">Revenue Trend</h3>
                                </div>
                                {revenue.length ? (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <LineChart data={revenue}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                                            <XAxis dataKey="_id" stroke="#d1d5db" fontSize={10} tickLine={false} />
                                            <YAxis stroke="#d1d5db" fontSize={10} tickLine={false} />
                                            <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                                            <Line type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#ec4899" }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState title="No revenue data yet" description="Revenue analytics appear once ticket sales begin." />
                                )}
                            </SurfaceCard>

                            <SurfaceCard>
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50">
                                        <Users size={14} className="text-pink-500" />
                                    </div>
                                    <h3 className="text-xs font-bold text-gray-900">User Growth</h3>
                                </div>
                                {metrics?.userGrowth?.length ? (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <BarChart data={metrics.userGrowth} barSize={20}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                                            <XAxis dataKey="_id" stroke="#d1d5db" fontSize={10} tickLine={false} />
                                            <YAxis stroke="#d1d5db" fontSize={10} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="count" fill="#fce7f3" radius={[6, 6, 0, 0]} stroke="#ec4899" strokeWidth={1.5} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState title="No growth data yet" description="User growth populates after new signups are recorded." />
                                )}
                            </SurfaceCard>
                        </div>

                        {/* Recent activity tables */}
                        <div className="grid gap-4 xl:grid-cols-3">
                            {/* Recent transactions */}
                            <SurfaceCard>
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-gray-900">Recent Transactions</h3>
                                    <Link to="/admin/transactions" className="text-[0.6rem] font-bold uppercase tracking-widest text-pink-500 hover:text-pink-700">
                                        View all →
                                    </Link>
                                </div>
                                <div className="space-y-2">
                                    {(stats.recentTransactions || []).slice(0, 5).map((tx) => (
                                        <div key={tx._id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-gray-900 truncate">{tx.event?.title || "Unknown event"}</p>
                                                <p className="mt-0.5 text-[0.6rem] text-gray-400 truncate">{tx.buyer?.name || "Unknown buyer"}</p>
                                            </div>
                                            <div className="flex-shrink-0 text-right">
                                                <p className="text-xs font-bold text-gray-900 tabular-nums">{formatCurrency(tx.amount || 0)}</p>
                                                <StatusBadge tone={tx.paymentStatus === "paid" ? "green" : "gray"}>
                                                    {tx.paymentStatus === "paid" ? "paid" : tx.paymentStatus}
                                                </StatusBadge>
                                            </div>
                                        </div>
                                    ))}
                                    {!stats.recentTransactions?.length && <p className="text-xs text-gray-400">No recent transactions.</p>}
                                </div>
                            </SurfaceCard>

                            {/* Recent withdrawals */}
                            <SurfaceCard>
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-gray-900">Recent Withdrawals</h3>
                                    <Link to="/admin/withdrawals" className="text-[0.6rem] font-bold uppercase tracking-widest text-pink-500 hover:text-pink-700">
                                        View all →
                                    </Link>
                                </div>
                                <div className="space-y-2">
                                    {(stats.recentWithdrawals || []).slice(0, 5).map((w) => (
                                        <div key={w._id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-gray-900 truncate">{w.organizer?.name || "Unknown"}</p>
                                                <p className="mt-0.5 text-[0.6rem] text-gray-400">{formatDateTime(w.createdAt)}</p>
                                            </div>
                                            <div className="flex-shrink-0 text-right">
                                                <p className="text-xs font-bold text-gray-900 tabular-nums">{formatCurrency(w.amount || 0)}</p>
                                                <StatusBadge tone={getStatusTone(w.status)}>{w.status}</StatusBadge>
                                            </div>
                                        </div>
                                    ))}
                                    {!stats.recentWithdrawals?.length && <p className="text-xs text-gray-400">No recent withdrawals.</p>}
                                </div>
                            </SurfaceCard>

                            {/* Admin activity */}
                            <SurfaceCard>
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-gray-900">Admin Activity</h3>
                                    <Link to="/admin/logs" className="text-[0.6rem] font-bold uppercase tracking-widest text-pink-500 hover:text-pink-700">
                                        View all →
                                    </Link>
                                </div>
                                <div className="space-y-2">
                                    {(stats.recentActivities || []).slice(0, 6).map((a) => (
                                        <div key={a._id} className="rounded-xl border border-gray-100 p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-xs font-semibold text-gray-900 leading-snug">
                                                    {(a.action || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                                                </p>
                                                <p className="flex-shrink-0 text-[0.55rem] text-gray-400">{formatDateTime(a.createdAt)}</p>
                                            </div>
                                            <p className="mt-0.5 text-[0.6rem] text-gray-400">{a.adminId?.name || "Unknown admin"}</p>
                                        </div>
                                    ))}
                                    {!stats.recentActivities?.length && <p className="text-xs text-gray-400">No admin activity logged yet.</p>}
                                </div>
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