import { useEffect, useState } from "react";
import { CreditCard, DollarSign, RefreshCcw, ShieldCheck, Wallet } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import {
    EmptyState,
    ErrorMessage,
    LoadingSpinner,
    PaginationControls,
    StatCard,
    StatusBadge,
    SurfaceCard,
} from "../components/AdminComponents";
import adminService from "../services/adminService";
import { formatCurrency, formatDateTime, formatNumber, getStatusTone } from "../utils/adminUtils";
import { useToast } from "../components/ui/toast";

export default function AdminFinance() {
    const toast = useToast();
    const [finance, setFinance] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);
    const [billing, setBilling] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const load = async (nextPage = page) => {
        try {
            setLoading(true);
            setError("");
            const [financeRes, subRes] = await Promise.all([
                adminService.getFinanceOverview(),
                adminService.getSubscriptions(nextPage, 12),
            ]);
            setFinance(financeRes);
            setSubscriptions(subRes.users          || []);
            setBilling(subRes.recentBilling        || []);
            setPagination(subRes.pagination        || { page: 1, pages: 1, total: 0 });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load finance overview.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(page); }, [page]);

    const handlePlanUpdate = async (userId, plan) => {
        try {
            await adminService.updateUserSubscription(userId, {
                plan,
                interval: "monthly",
                status:   plan === "free" ? "inactive" : "active",
            });
            toast.success(`Subscription updated to ${plan}.`);
            load(page);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update subscription.");
        }
    };

    const summary = finance?.summary || {};

    // Plan badge colours
    const planTone = (plan) => {
        if (!plan || plan === "free")  return "gray";
        if (plan === "trial")          return "amber";
        if (plan === "pro")            return "pink";
        return "blue";
    };

    return (
        <AdminLayout
            title="Finance & Billing"
            description="Track platform revenue, payouts, subscriptions, and payment health."
        >
            {error && <ErrorMessage message={error} onDismiss={() => setError("")} className="mb-5" />}

            {loading ? (
                <LoadingSpinner label="Loading finance overview…" />
            ) : (
                <div className="space-y-5">
                    {/* Stat cards */}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <StatCard
                            icon={DollarSign}
                            label="Gross Ticket Revenue"
                            value={formatCurrency(summary.grossTicketRevenue  || 0)}
                            detail={`${formatNumber(summary.totalTicketsSold || 0)} tickets sold`}
                        />
                        <StatCard
                            icon={ShieldCheck}
                            label="Platform Revenue"
                            value={formatCurrency(summary.netPlatformRevenue  || 0)}
                            detail="Commission + subscriptions + fees"
                        />
                        <StatCard
                            icon={CreditCard}
                            label="Subscriptions"
                            value={formatCurrency(summary.subscriptionRevenue || 0)}
                            detail={`${formatNumber(summary.subscriptionPayments || 0)} charges`}
                        />
                        <StatCard
                            icon={Wallet}
                            label="Pending Payouts"
                            value={formatCurrency(summary.pendingPayouts       || 0)}
                            detail="Queued organizer withdrawals"
                            accent
                        />
                        <StatCard
                            icon={RefreshCcw}
                            label="Failed Withdrawals"
                            value={formatNumber(summary.failedWithdrawals      || 0)}
                            detail={`${formatCurrency(summary.withdrawalFees  || 0)} in fees`}
                        />
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                        {/* ── Subscriptions ── */}
                        <SurfaceCard>
                            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
                                <div>
                                    <p className="text-[0.6rem] font-bold uppercase tracking-widest text-pink-400">Subscription Management</p>
                                    <h3 className="mt-1 text-sm font-extrabold text-gray-900">Active Plans</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => load(page)}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-100 px-3 py-2 text-xs font-semibold text-gray-500 hover:border-pink-200 hover:text-pink-500 transition-colors active:scale-95"
                                >
                                    <RefreshCcw size={12} /> Refresh
                                </button>
                            </div>

                            {subscriptions.length === 0 ? (
                                <EmptyState
                                    title="No subscriptions found"
                                    description="Subscription records will appear here once users upgrade."
                                />
                            ) : (
                                <div className="space-y-2">
                                    {subscriptions.map((user) => (
                                        <div
                                            key={user._id}
                                            className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 hover:border-pink-100 transition-colors"
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-gray-900 truncate">
                                                        {user.name || user.username}
                                                    </p>
                                                    <p className="mt-0.5 text-[0.58rem] text-gray-400">{user.email}</p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <StatusBadge tone={planTone(user.plan)}>
                                                        {user.plan || "free"}
                                                    </StatusBadge>
                                                    <StatusBadge tone={getStatusTone(user.subscriptionStatus)}>
                                                        {user.subscriptionStatus || "inactive"}
                                                    </StatusBadge>
                                                    <select
                                                        value={user.plan || "free"}
                                                        onChange={(e) => handlePlanUpdate(user._id, e.target.value)}
                                                        className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
                                                    >
                                                        <option value="free">Free</option>
                                                        <option value="trial">Trial</option>
                                                        <option value="pro">Pro</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SurfaceCard>

                        {/* ── Billing History ── */}
                        <SurfaceCard>
                            <div className="mb-4 border-b border-gray-100 pb-4">
                                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-pink-400">Recent Billing</p>
                                <h3 className="mt-1 text-sm font-extrabold text-gray-900">Latest Charges</h3>
                            </div>
                            <div className="space-y-2">
                                {billing.length === 0 ? (
                                    <p className="text-xs text-gray-400">No billing history available.</p>
                                ) : (
                                    billing.map((entry) => (
                                        <div
                                            key={entry._id}
                                            className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 hover:border-pink-100 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-gray-900 truncate">
                                                        {entry.userId?.name || entry.userId?.email || "Unknown user"}
                                                    </p>
                                                    <p className="mt-0.5 text-[0.58rem] text-gray-400 truncate">{entry.reference}</p>
                                                </div>
                                                <StatusBadge tone={getStatusTone(entry.status)}>
                                                    {entry.status}
                                                </StatusBadge>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-[0.58rem] text-gray-400">
                                                    {entry.plan} / {entry.interval}
                                                </span>
                                                <span className="text-xs font-extrabold text-gray-900 tabular-nums">
                                                    {formatCurrency(entry.amount || 0)}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-[0.55rem] text-gray-300">{formatDateTime(entry.createdAt)}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </SurfaceCard>
                    </div>

                    <PaginationControls
                        page={pagination.page || page}
                        pages={pagination.pages || 1}
                        total={pagination.total}
                        label="subscription accounts"
                        onPrevious={() => setPage((c) => Math.max(1, c - 1))}
                        onNext={() => setPage((c) => Math.min(pagination.pages || 1, c + 1))}
                    />
                </div>
            )}
        </AdminLayout>
    );
}