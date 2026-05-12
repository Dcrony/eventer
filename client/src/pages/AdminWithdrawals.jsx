import { useEffect, useState } from "react";
import { CheckCircle2, Download, Search, Wallet, XCircle, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import adminService from "../services/adminService";
import { formatCurrency, formatDateTime, formatNumber, getStatusTone } from "../utils/adminUtils";
import { useToast } from "../components/ui/toast";

function StatCard({ icon: Icon, label, value, detail }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
                </div>
                {Icon && (
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-500">
                        <Icon size={18} />
                    </div>
                )}
            </div>
            {detail && <p className="mt-3 text-xs text-gray-500">{detail}</p>}
        </div>
    );
}

function SurfaceCard({ children, className = "" }) {
    return <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`.trim()}>{children}</div>;
}

function LoadingSpinner({ label = "Loading..." }) {
    return (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="text-center">
                <div className="mx-auto h-8 w-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                <p className="mt-3 text-sm text-gray-500">{label}</p>
            </div>
        </div>
    );
}

function ErrorMessage({ message, onDismiss }) {
    return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span className="text-sm font-semibold">Error</span>
                </div>
                {onDismiss && (
                    <button onClick={onDismiss} className="text-xs font-semibold uppercase tracking-wider text-red-600 hover:text-red-700">
                        Dismiss
                    </button>
                )}
            </div>
            <p className="mt-2 text-sm leading-relaxed">{message}</p>
        </div>
    );
}

function EmptyState({ icon: Icon, title, description }) {
    return (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
            <div>
                <Icon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">{description}</p>
            </div>
        </div>
    );
}

function StatusBadge({ tone = "gray", children }) {
    const tones = {
        green: "bg-green-100 text-green-700",
        amber: "bg-amber-100 text-amber-700",
        red: "bg-red-100 text-red-700",
        pink: "bg-pink-100 text-pink-700",
        gray: "bg-gray-100 text-gray-700",
        blue: "bg-blue-100 text-blue-700",
    };

    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.gray}`}>
            {children}
        </span>
    );
}

function PaginationControls({ page, pages, onPrevious, onNext, total, label = "results" }) {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-500">
                Page {page} of {pages} {typeof total === "number" ? `- ${formatNumber(total)} ${label}` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-pink-300 hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft size={16} />
                    Previous
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={page >= pages}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-pink-300 hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                    <ChevronRight size={16} />
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
                {/* Search and Export */}
                <div className="grid gap-4 lg:grid-cols-[1.5fr_auto]">
                    <SurfaceCard>
                        <div className="flex items-center gap-2">
                            <Search size={18} className="text-pink-500 flex-shrink-0" />
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") applySearch();
                                }}
                                placeholder="Search organizer by name or email"
                                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                            />
                            <button
                                type="button"
                                onClick={applySearch}
                                className="rounded-xl bg-pink-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/25"
                            >
                                Search
                            </button>
                        </div>
                    </SurfaceCard>
                    <button
                        type="button"
                        onClick={exportToCSV}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-gray-800 hover:-translate-y-0.5"
                    >
                        <Download size={18} />
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
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Status</p>
                        <select
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(event.target.value);
                                setPage(1);
                            }}
                            className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                        >
                            {["all", "pending", "processing", "completed", "rejected", "failed"].map((status) => (
                                <option key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                            ))}
                        </select>
                    </SurfaceCard>

                    <SurfaceCard>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Start date</p>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(event) => {
                                setStartDate(event.target.value);
                                setPage(1);
                            }}
                            className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                        />
                    </SurfaceCard>

                    <SurfaceCard>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">End date</p>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(event) => {
                                setEndDate(event.target.value);
                                setPage(1);
                            }}
                            className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                        />
                    </SurfaceCard>

                    <SurfaceCard>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Monthly trend</p>
                        <div className="mt-3 space-y-2">
                            {monthlyData.slice(-3).map((item) => (
                                <div key={item.month} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">{item.month}</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(item.completed || item.total || 0)}</span>
                                </div>
                            ))}
                            {monthlyData.length === 0 && <p className="text-sm text-gray-500">No monthly data yet.</p>}
                        </div>
                    </SurfaceCard>
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {/* Withdrawals Table */}
                {loading ? (
                    <LoadingSpinner label="Loading withdrawals..." />
                ) : withdrawals.length === 0 ? (
                    <EmptyState icon={Wallet} title="No withdrawals found" description="There are no payout requests for the current filters yet." />
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Organizer</th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Bank</th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Amount</th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Requested</th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {withdrawals.map((withdrawal) => (
                                        <tr key={withdrawal._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-gray-900">
                                                    {withdrawal.organizer?.name || withdrawal.organizer?.username || "Unknown user"}
                                                </div>
                                                <div className="mt-0.5 text-xs text-gray-500">{withdrawal.organizer?.email || "No email"}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-gray-700">{withdrawal.bankDetails?.bankName || "N/A"}</div>
                                                <div className="mt-0.5 text-xs text-gray-500">{withdrawal.bankDetails?.accountNumber || "No account number"}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-gray-900">{formatCurrency(withdrawal.amount || 0)}</div>
                                                <div className="mt-0.5 text-xs text-gray-500">Fee: {formatCurrency(withdrawal.fee || 0)}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge tone={getStatusTone(withdrawal.status)}>{withdrawal.status}</StatusBadge>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-500">{formatDateTime(withdrawal.createdAt)}</td>
                                            <td className="px-5 py-4">
                                                {withdrawal.status === "pending" ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAction(withdrawal._id, "approved")}
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-green-500 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-green-600"
                                                        >
                                                            <CheckCircle2 size={14} />
                                                            Approve
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAction(withdrawal._id, "rejected")}
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-red-600"
                                                        >
                                                            <XCircle size={14} />
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-500">
                                                        {withdrawal.processedBy?.name ? `Handled by ${withdrawal.processedBy.name}` : "No action needed"}
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
                    onPrevious={() => setPage((current) => Math.max(1, current - 1))}
                    onNext={() => setPage((current) => Math.min(pagination.pages || 1, current + 1))}
                />
            </div>
        </AdminLayout>
    );
}