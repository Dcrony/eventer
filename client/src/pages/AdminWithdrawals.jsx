import { useEffect, useState } from "react";
import { CheckCircle2, Download, Search, Wallet, XCircle, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import adminService from "../services/adminService";
import { formatCurrency, formatDateTime, formatNumber, getStatusTone } from "../utils/adminUtils";
import { useToast } from "../components/ui/toast";

function StatCard({ icon: Icon, label, value, detail }) {
    return (
        <div className="relative rounded-2xl border border-pink-100 bg-white p-5 overflow-hidden group hover:border-pink-200 hover:shadow-md transition-all duration-200">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-pink-500" />
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                    <p className="mt-2 text-2xl font-black text-gray-900 tabular-nums">{value}</p>
                </div>
                {Icon && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-500 group-hover:bg-pink-100 transition-colors">
                        <Icon size={18} />
                    </div>
                )}
            </div>
            {detail && <p className="mt-3 text-xs text-gray-400">{detail}</p>}
        </div>
    );
}

function SurfaceCard({ children, className = "" }) {
    return (
        <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`.trim()}>
            {children}
        </div>
    );
}

function LoadingSpinner({ label = "Loading..." }) {
    return (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="text-center">
                <div className="mx-auto h-8 w-8 rounded-full border-2 border-pink-100 border-t-pink-500 animate-spin" />
                <p className="mt-3 text-sm text-gray-400">{label}</p>
            </div>
        </div>
    );
}

function ErrorMessage({ message, onDismiss }) {
    return (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                    <span className="text-sm font-bold text-red-700">Error</span>
                </div>
                {onDismiss && (
                    <button onClick={onDismiss} className="text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-600 transition-colors">
                        Dismiss
                    </button>
                )}
            </div>
            <p className="mt-2 text-sm text-red-600 leading-relaxed">{message}</p>
        </div>
    );
}

function EmptyState({ icon: Icon, title, description }) {
    return (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
            <div>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50">
                    <Icon className="h-6 w-6 text-pink-300" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                <p className="mt-2 max-w-xs text-xs leading-relaxed text-gray-400">{description}</p>
            </div>
        </div>
    );
}

function StatusBadge({ tone = "gray", children }) {
    const tones = {
        green: "bg-green-50 text-green-700 border border-green-100",
        amber: "bg-amber-50 text-amber-700 border border-amber-100",
        red: "bg-red-50 text-red-700 border border-red-100",
        pink: "bg-pink-50 text-pink-700 border border-pink-100",
        gray: "bg-gray-50 text-gray-600 border border-gray-100",
        blue: "bg-blue-50 text-blue-700 border border-blue-100",
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-bold capitalize ${tones[tone] || tones.gray}`}>
            {children}
        </span>
    );
}

function PaginationControls({ page, pages, onPrevious, onNext, total, label = "results" }) {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-gray-400">
                Page <span className="font-bold text-gray-700">{page}</span> of <span className="font-bold text-gray-700">{pages}</span>
                {typeof total === "number" ? <> · <span className="font-bold text-gray-700">{formatNumber(total)}</span> {label}</> : ""}
            </p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 transition-all hover:border-pink-300 hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft size={14} />
                    Previous
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={page >= pages}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 transition-all hover:border-pink-300 hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}

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

    // BUG FIX: Build filters inside the fetch function to avoid stale closure issues
    const buildFilters = () => ({
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        ...(searchTerm ? { search: searchTerm } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
    });

    useEffect(() => {
        fetchPageData();
    }, [page, statusFilter, startDate, endDate]);

    const fetchPageData = async (overrideFilters, nextPage = page) => {
        const filters = overrideFilters ?? buildFilters();
        try {
            setLoading(true);
            setError(null);

            const [withdrawalsRes, analyticsRes, monthlyRes] = await Promise.all([
                adminService.getWithdrawals(nextPage, 20, filters),
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
        fetchPageData(buildFilters(), 1);
    };

    const handleAction = async (id, status) => {
        try {
            await adminService.updateWithdrawalStatus(id, status);
            toast.success(`Withdrawal ${status === "approved" ? "approved" : "rejected"} successfully.`);
            fetchPageData(buildFilters(), page);
        } catch (err) {
            setError(err.response?.data?.message || "Action failed");
        }
    };

    const exportToCSV = async () => {
        try {
            const blob = await adminService.exportWithdrawals(buildFilters());
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
            description="Review organizer payout requests, platform fees, payout volume, and transfer status."
        >
            <div className="space-y-5">
                {/* Search and Export */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex flex-1 items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-pink-50 transition-all">
                        <Search size={15} className="text-pink-400 flex-shrink-0" />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
                            placeholder="Search organizer by name or email"
                            className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
                        />
                        <button
                            type="button"
                            onClick={applySearch}
                            className="rounded-xl bg-pink-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-pink-600 transition-colors"
                        >
                            Search
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={exportToCSV}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-xs font-bold text-gray-700 shadow-sm hover:border-pink-300 hover:text-pink-600 transition-all"
                    >
                        <Download size={15} />
                        Export CSV
                    </button>
                </div>

                {/* Stats Cards */}
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

                {/* Filters */}
                <div className="grid gap-4 md:grid-cols-4">
                    <SurfaceCard>
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">Status</p>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="mt-3 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs font-medium text-gray-700 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-50"
                        >
                            {["all", "pending", "processing", "completed", "rejected", "failed"].map((s) => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                        </select>
                    </SurfaceCard>

                    <SurfaceCard>
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">Start Date</p>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className="mt-3 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-50"
                        />
                    </SurfaceCard>

                    <SurfaceCard>
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">End Date</p>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className="mt-3 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-50"
                        />
                    </SurfaceCard>

                    <SurfaceCard>
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">Monthly Trend</p>
                        <div className="mt-3 space-y-2">
                            {monthlyData.slice(-3).map((item) => (
                                <div key={item.month} className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">{item.month}</span>
                                    <span className="text-xs font-bold text-gray-900 tabular-nums">{formatCurrency(item.completed || item.total || 0)}</span>
                                </div>
                            ))}
                            {monthlyData.length === 0 && <p className="text-xs text-gray-400">No monthly data yet.</p>}
                        </div>
                    </SurfaceCard>
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {/* Table */}
                {loading ? (
                    <LoadingSpinner label="Loading withdrawals..." />
                ) : withdrawals.length === 0 ? (
                    <EmptyState icon={Wallet} title="No withdrawals found" description="There are no payout requests for the current filters yet." />
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-50 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {["Organizer", "Bank", "Amount", "Status", "Requested", "Actions"].map((col) => (
                                            <th key={col} className="px-5 py-3.5 text-left text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {withdrawals.map((w) => (
                                        <tr key={w._id} className="group transition-colors hover:bg-pink-50/30">
                                            <td className="px-5 py-4">
                                                <div className="text-xs font-bold text-gray-900">{w.organizer?.name || w.organizer?.username || "Unknown"}</div>
                                                <div className="mt-0.5 text-[0.6rem] text-gray-400">{w.organizer?.email || "No email"}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-xs font-semibold text-gray-700">{w.bankDetails?.bankName || "N/A"}</div>
                                                <div className="mt-0.5 text-[0.6rem] text-gray-400">{w.bankDetails?.accountNumber || "—"}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-xs font-bold text-gray-900 tabular-nums">{formatCurrency(w.amount || 0)}</div>
                                                <div className="mt-0.5 text-[0.6rem] text-gray-400">Fee: {formatCurrency(w.fee || 0)}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge tone={getStatusTone(w.status)}>{w.status}</StatusBadge>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-gray-400">{formatDateTime(w.createdAt)}</td>
                                            <td className="px-5 py-4">
                                                {w.status === "pending" ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAction(w._id, "approved")}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-green-500 px-3 py-1.5 text-[0.65rem] font-bold text-white hover:bg-green-600 transition-colors"
                                                        >
                                                            <CheckCircle2 size={12} />
                                                            Approve
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAction(w._id, "rejected")}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-red-500 px-3 py-1.5 text-[0.65rem] font-bold text-white hover:bg-red-600 transition-colors"
                                                        >
                                                            <XCircle size={12} />
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[0.6rem] text-gray-400">
                                                        {w.processedBy?.name ? `By ${w.processedBy.name}` : "No action needed"}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <PaginationControls
                    page={pagination.page || page}
                    pages={pagination.pages || 1}
                    total={pagination.total}
                    label="withdrawals"
                    onPrevious={() => setPage((c) => Math.max(1, c - 1))}
                    onNext={() => setPage((c) => Math.min(pagination.pages || 1, c + 1))}
                />
            </div>
        </AdminLayout>
    );
}