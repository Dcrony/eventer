import { useEffect, useState } from "react";
import { CreditCard, DollarSign, RefreshCcw, ShieldCheck, Wallet } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { EmptyState, ErrorMessage, LoadingSpinner, PaginationControls, StatCard, StatusBadge, SurfaceCard } from "../components/AdminComponents";
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

  const loadFinance = async (nextPage = page) => {
    try {
      setLoading(true);
      setError("");
      const [financeRes, subscriptionRes] = await Promise.all([
        adminService.getFinanceOverview(),
        adminService.getSubscriptions(nextPage, 12),
      ]);

      setFinance(financeRes);
      setSubscriptions(subscriptionRes.users || []);
      setBilling(subscriptionRes.recentBilling || []);
      setPagination(subscriptionRes.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load finance overview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinance(page);
  }, [page]);

  const handlePlanUpdate = async (userId, plan) => {
    try {
      await adminService.updateUserSubscription(userId, {
        plan,
        interval: plan === "free" ? "monthly" : "monthly",
        status: plan === "free" ? "inactive" : "active",
      });
      toast.success(`Subscription updated to ${plan}.`);
      loadFinance(page);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update subscription.");
    }
  };

  const summary = finance?.summary || {};

  return (
    <AdminLayout title="Finance & Billing" description="Track platform revenue, payouts, subscriptions, and payment health from one place.">
      {error ? <ErrorMessage message={error} onDismiss={() => setError("")} /> : null}

      {loading ? (
        <LoadingSpinner label="Loading finance overview..." />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard icon={DollarSign} label="Gross Ticket Revenue" value={formatCurrency(summary.grossTicketRevenue || 0)} detail={`${formatNumber(summary.totalTicketsSold || 0)} tickets sold`} />
            <StatCard icon={ShieldCheck} label="Platform Revenue" value={formatCurrency(summary.netPlatformRevenue || 0)} detail="Commission + subscriptions + fees" />
            <StatCard icon={CreditCard} label="Subscriptions" value={formatCurrency(summary.subscriptionRevenue || 0)} detail={`${formatNumber(summary.subscriptionPayments || 0)} successful charges`} />
            <StatCard icon={Wallet} label="Pending Payouts" value={formatCurrency(summary.pendingPayouts || 0)} detail="Queued organizer withdrawals" />
            <StatCard icon={RefreshCcw} label="Failed Withdrawals" value={formatNumber(summary.failedWithdrawals || 0)} detail={`${formatCurrency(summary.withdrawalFees || 0)} in withdrawal fees`} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <SurfaceCard>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Subscription Management</p>
                  <h3 className="text-lg font-extrabold text-gray-900">Active Plans</h3>
                </div>
                <button type="button" onClick={() => loadFinance(page)} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-pink-300 hover:text-pink-600">
                  Refresh
                </button>
              </div>

              {!subscriptions.length ? (
                <EmptyState title="No subscriptions found" description="Subscription records will appear here once users upgrade." />
              ) : (
                <div className="space-y-3">
                  {subscriptions.map((user) => (
                    <div key={user._id} className="rounded-2xl border border-gray-200 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user.name || user.username}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{user.email}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge tone={getStatusTone(user.plan)}>{user.plan || "free"}</StatusBadge>
                          <StatusBadge tone={getStatusTone(user.subscriptionStatus)}>{user.subscriptionStatus || "inactive"}</StatusBadge>
                          <select
                            value={user.plan || "free"}
                            onChange={(event) => handlePlanUpdate(user._id, event.target.value)}
                            className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 outline-none"
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

            <SurfaceCard>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Recent Billing History</p>
              <h3 className="mt-1 text-lg font-extrabold text-gray-900">Latest Charges</h3>
              <div className="mt-4 space-y-3">
                {billing.map((entry) => (
                  <div key={entry._id} className="rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{entry.userId?.name || entry.userId?.email || "Unknown user"}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{entry.reference}</p>
                      </div>
                      <StatusBadge tone={getStatusTone(entry.status)}>{entry.status}</StatusBadge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>{entry.plan} / {entry.interval}</span>
                      <span>{formatCurrency(entry.amount || 0)}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{formatDateTime(entry.createdAt)}</p>
                  </div>
                ))}
                {!billing.length ? <p className="text-sm text-gray-500">No billing history available.</p> : null}
              </div>
            </SurfaceCard>
          </div>

          <PaginationControls
            page={pagination.page || page}
            pages={pagination.pages || 1}
            total={pagination.total}
            label="subscription accounts"
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => Math.min(pagination.pages || 1, current + 1))}
          />
        </div>
      )}
    </AdminLayout>
  );
}
