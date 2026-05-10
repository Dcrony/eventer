import { useEffect, useState } from "react";
import { CheckCircle2, Download, Search, Wallet, XCircle } from "lucide-react";
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

export default function AdminWithdrawals() {
  const toast = useToast();
  const [withdrawals, setWithdrawals] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const filters = {
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(searchTerm ? { search: searchTerm } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  };

  useEffect(() => {
    fetchPageData();
  }, [page, statusFilter, startDate, endDate]);

  const fetchPageData = async (overrideFilters = filters, nextPage = page) => {
    try {
      setLoading(true);
      setError(null);

      const [withdrawalsRes, analyticsRes, monthlyRes] = await Promise.all([
        adminService.getWithdrawals(nextPage, 20, overrideFilters),
        adminService.getWithdrawalAnalytics(),
        adminService.getWithdrawalMonthlyTrend(),
      ]);

      setWithdrawals(withdrawalsRes.withdrawals || []);
      setSummary(withdrawalsRes.summary || null);
      setPagination(withdrawalsRes.pagination || { page: 1, pages: 1, total: 0 });
      setAnalytics(analyticsRes || null);
      setMonthlyData(monthlyRes || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch withdrawals.");
    } finally {
      setLoading(false);
    }
  };

  const applySearch = () => {
    setPage(1);
    fetchPageData(filters, 1);
  };

  const handleAction = async (id, status) => {
    try {
      await adminService.updateWithdrawalStatus(id, status);
      toast.success(`Withdrawal ${status === "approved" ? "approved" : "rejected"} successfully.`);
      fetchPageData(filters, page);
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    }
  };

  const exportToCSV = async () => {
    try {
      const blob = await adminService.exportWithdrawals(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `withdrawals-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success("Withdrawal export started.");
    } catch {
      setError("Failed to export withdrawals.");
    }
  };

  return (
    <AdminLayout
      title="Withdrawal Management"
      description="Review organizer payout requests, platform fees, payout volume, and transfer status in one place."
    >
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_auto]">
          <SurfaceCard>
            <div className="flex flex-wrap items-center gap-3">
              <Search className="text-pink-500" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applySearch();
                }}
                placeholder="Search organizer by name or email"
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
              />
              <button
                type="button"
                onClick={applySearch}
                className="rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-pink-700"
              >
                Search
              </button>
            </div>
          </SurfaceCard>
          <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Wallet}
            label="Requested"
            value={formatCurrency(summary?.totalRequested || 0)}
            detail={`${formatNumber(pagination.total || 0)} matching requests`}
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={formatCurrency(analytics?.totalPaid || 0)}
            detail="Paid out successfully"
          />
          <StatCard
            icon={Wallet}
            label="Pending"
            value={formatCurrency(analytics?.totalPending || 0)}
            detail="Awaiting review or transfer"
          />
          <StatCard
            icon={Wallet}
            label="Platform Fees"
            value={formatCurrency(analytics?.totalPlatformFees || 0)}
            detail="Withdrawal processing fees"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SurfaceCard>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Status</p>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
            >
              {["all", "pending", "processing", "completed", "rejected", "failed"].map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </SurfaceCard>

          <SurfaceCard>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Start date</p>
            <input
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setPage(1);
              }}
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
            />
          </SurfaceCard>

          <SurfaceCard>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">End date</p>
            <input
              type="date"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPage(1);
              }}
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
            />
          </SurfaceCard>

          <SurfaceCard>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Monthly trend</p>
            <div className="mt-4 space-y-2">
              {monthlyData.slice(-3).map((item) => (
                <div key={item.month} className="flex items-center justify-between text-sm text-slate-600">
                  <span>{item.month}</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(item.completed || item.total || 0)}</span>
                </div>
              ))}
              {monthlyData.length === 0 ? <p className="text-sm text-slate-500">No monthly data yet.</p> : null}
            </div>
          </SurfaceCard>
        </div>

        {error ? <ErrorMessage message={error} onDismiss={() => setError(null)} /> : null}

        {loading ? (
          <LoadingSpinner label="Loading withdrawals..." />
        ) : withdrawals.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No withdrawals found"
            description="There are no payout requests for the current filters yet."
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Organizer</th>
                  <th className="px-6 py-4 text-left font-semibold">Bank</th>
                  <th className="px-6 py-4 text-left font-semibold">Amount</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-left font-semibold">Requested</th>
                  <th className="px-6 py-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-950">
                        {withdrawal.organizer?.name || withdrawal.organizer?.username || "Unknown user"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{withdrawal.organizer?.email || "No email"}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div>{withdrawal.bankDetails?.bankName || "N/A"}</div>
                      <div className="mt-1 text-xs text-slate-500">{withdrawal.bankDetails?.accountNumber || "No account number"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-950">{formatCurrency(withdrawal.amount || 0)}</div>
                      <div className="mt-1 text-xs text-slate-500">Fee: {formatCurrency(withdrawal.fee || 0)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={getStatusTone(withdrawal.status)}>{withdrawal.status}</StatusBadge>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatDateTime(withdrawal.createdAt)}</td>
                    <td className="px-6 py-4">
                      {withdrawal.status === "pending" ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleAction(withdrawal._id, "approved")}
                            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                          >
                            <CheckCircle2 size={14} />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(withdrawal._id, "rejected")}
                            className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {withdrawal.processedBy?.name ? `Handled by ${withdrawal.processedBy.name}` : "No action needed"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <PaginationControls
          page={pagination.page || page}
          pages={pagination.pages || 1}
          total={pagination.total}
          label="withdrawals"
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() => setPage((current) => Math.min(pagination.pages || 1, current + 1))}
        />
      </div>
    </AdminLayout>
  );
}
